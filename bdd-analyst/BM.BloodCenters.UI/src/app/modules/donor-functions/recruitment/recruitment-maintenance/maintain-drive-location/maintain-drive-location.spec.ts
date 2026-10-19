import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MaintainDriveLocationComponent } from './maintain-drive-location';
import { MaintainDriveLocationService } from './services/maintain-drive-location.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { PageEvent } from '@angular/material/paginator';
import { of, throwError, Subject } from 'rxjs';
import { DriveLocation } from './models/maintain-drive-location.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('MaintainDriveLocationComponent', () => {
  let component: MaintainDriveLocationComponent;
  let fixture: ComponentFixture<MaintainDriveLocationComponent>;
  let mockService: jasmine.SpyObj<MaintainDriveLocationService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockSnackBar: jasmine.SpyObj<SnackbarService>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;
  let mockPageHeaderService: { pageHeaderData: ReturnType<typeof signal> };
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let chapterChanged$: Subject<void>;

  const mockDriveLocation: DriveLocation = {
    locationId: 'LOCN001',
    locationName: 'Test Location',
    locationType: 'FIX',
    locationTypeDescription: 'Fixed',
    sponsorId: 'SPONSOR001',
    sponsorName: 'Test Sponsor',
    city: 'Dallas',
    travelTime: 30,
    travelDistance: 15.5,
    openTime: '08:00',
    closeTime: '17:00',
    effDate: '2026-01-01',
    termDate: '2026-12-31',
    chapterId: 'WAD',
    programId: 'DRIVELOC'
  };

  const mockResponse = { data: [mockDriveLocation], totalRecords: 1 };

  beforeEach(() => {
    chapterChanged$ = new Subject<void>();

    mockService = jasmine.createSpyObj('MaintainDriveLocationService', [
      'searchDriveLocations',
      'getDriveLocationDetails',
      'upsertDriveLocation'
    ]);

    mockHeaderService = createMockHeaderService({ chapterId: signal('LOCN001') });
    (mockHeaderService as any).chapterChanged$ = chapterChanged$;
    mockHeaderService.getCurrentChapterId.and.returnValue('WAD');

    mockSnackBar = createMockSnackbarService();

    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate',
      'isChapterLocalDateAvailable',
      'getChapterUtcOffsetMinutes'
    ]);
    mockChapterTimezoneService.isChapterLocalDateAvailable.and.returnValue(true);
    mockChapterTimezoneService.getChapterUtcOffsetMinutes.and.returnValue(null);

    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockPageHeaderService = { pageHeaderData: signal(undefined) };
    mockService.searchDriveLocations.and.returnValue(of(mockResponse));

    TestBed.configureTestingModule({
      imports: [MaintainDriveLocationComponent, NoopAnimationsModule],
      providers: [
        { provide: MaintainDriveLocationService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: SnackbarService, useValue: mockSnackBar },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: MatDialog, useValue: mockDialog },
        provideHttpClient()
      ]
    });

    fixture = TestBed.createComponent(MaintainDriveLocationComponent);
    component = fixture.componentInstance;
  });

  // ── Initialization ──────────────────────────────────────────────────────
  describe('Component Initialization', () => {
    it('should load drive locations on init', () => {
      component.ngOnInit();
      expect(mockService.searchDriveLocations).toHaveBeenCalled();
      expect(component.dataSource()).toEqual([mockDriveLocation]);
      expect(component.totalRecords()).toBe(1);
    });

    it('should set isLoading false after load completes', () => {
      component.ngOnInit();
      expect(component.isLoading()).toBe(false);
    });

    it('should set hasError false on successful load', () => {
      component.ngOnInit();
      expect(component.hasError()).toBe(false);
    });
  });

  // ── Search ──────────────────────────────────────────────────────────────
  describe('Search Functionality', () => {
    it('should update search text and reload', () => {
      component.ngOnInit();
      component.onSearch('test');
      expect(component.searchText()).toBe('test');
      expect(mockService.searchDriveLocations).toHaveBeenCalledTimes(2);
    });

    it('should reset pageIndex to 0 on search', () => {
      component.pageIndex = 3;
      component.onSearch('abc');
      expect(component.pageIndex).toBe(0);
    });

    it('should handle search error gracefully', () => {
      mockService.searchDriveLocations.and.returnValue(throwError(() => new Error('Search failed')));
      component.ngOnInit();
      expect(component.hasError()).toBe(true);
    });

    it('should handle 500 error gracefully', () => {
      mockService.searchDriveLocations.and.returnValue(throwError(() => ({ status: 500, message: 'Server error' })));
      component.ngOnInit();
      expect(component.hasError()).toBe(true);
    });

    it('should set errorMessage on error', () => {
      mockService.searchDriveLocations.and.returnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      expect(component.errorMessage()).toBeTruthy();
    });
  });

  // ── Pagination ──────────────────────────────────────────────────────────
  describe('Pagination', () => {
    it('should update pageSize and pageIndex on page change', () => {
      const event: PageEvent = { pageIndex: 2, pageSize: 50, length: 100 };
      component.onPageChange(event);
      expect(component.pageSize).toBe(50);
      expect(component.pageIndex).toBe(2);
      expect(mockService.searchDriveLocations).toHaveBeenCalled();
    });

    it('should compute correct skip value from pageIndex and pageSize', () => {
      component.pageSize = 25;
      component.pageIndex = 2;
      component.loadData();
      const [take, skip] = mockService.searchDriveLocations.calls.mostRecent().args;
      expect(take).toBe(25);
      expect(skip).toBe(50);
    });

    it('should use pageSize from page event', () => {
      const event: PageEvent = { pageIndex: 0, pageSize: 100, length: 200 };
      component.onPageChange(event);
      const [take] = mockService.searchDriveLocations.calls.mostRecent().args;
      expect(take).toBe(100);
    });
  });

  // ── Sorting ─────────────────────────────────────────────────────────────
  describe('Sorting', () => {
    it('should toggle sort direction ASC to DESC', () => {
      component.sortDirection = 'ASC';
      component.onSortChange('locationType');
      expect(component.sortDirection).toBe('DESC');
    });

    it('should toggle sort direction DESC to ASC', () => {
      component.sortDirection = 'DESC';
      component.onSortChange('locationType');
      expect(component.sortDirection).toBe('ASC');
    });

    it('should reload data after sort change', () => {
      component.ngOnInit();
      component.onSortChange('locationType');
      expect(mockService.searchDriveLocations).toHaveBeenCalledTimes(2);
    });

    it('should ignore sort change for unknown column', () => {
      const callsBefore = mockService.searchDriveLocations.calls.count();
      component.onSortChange('unknownColumn');
      expect(mockService.searchDriveLocations.calls.count()).toBe(callsBefore);
    });

    it('should return arrow_upward icon for ASC sort', () => {
      component.sortDirection = 'ASC';
      expect(component.getSortIcon('locationType')).toBe('arrow_upward');
    });

    it('should return arrow_downward icon for DESC sort', () => {
      component.sortDirection = 'DESC';
      expect(component.getSortIcon('locationType')).toBe('arrow_downward');
    });

    it('should return empty string for non-sortable column', () => {
      expect(component.getSortIcon('city')).toBe('');
    });
  });

  // ── Filter ──────────────────────────────────────────────────────────────
  describe('Filter Panel', () => {
    it('should toggle filter open state', () => {
      expect(component.isFilterOpen()).toBe(false);
      component.toggleFilter();
      expect(component.isFilterOpen()).toBe(true);
      component.toggleFilter();
      expect(component.isFilterOpen()).toBe(false);
    });

    it('should apply filters and reload data', () => {
      component.ngOnInit();
      const filters = { effDate: '2026-01-01', effDatePeriod: 'AFTER', termDate: null, termDatePeriod: null, showTerminated: false };
      component.applyFilters(filters as any);
      expect(component.appliedFilters()).toEqual(filters as any);
      expect(mockService.searchDriveLocations).toHaveBeenCalledTimes(2);
    });

    it('should reset pageIndex on applyFilters', () => {
      component.pageIndex = 5;
      component.applyFilters({ effDate: null, effDatePeriod: null, termDate: null, termDatePeriod: null, showTerminated: false } as any);
      expect(component.pageIndex).toBe(0);
    });

    it('should close filter panel on applyFilters', () => {
      component.isFilterOpen.set(true);
      component.applyFilters({ effDate: null, effDatePeriod: null, termDate: null, termDatePeriod: null, showTerminated: false } as any);
      expect(component.isFilterOpen()).toBe(false);
    });

    it('should remove filter chip and reload', () => {
      component.ngOnInit();
      component.appliedFilters.set({ effDate: '2026-01-01', effDatePeriod: 'AFTER', termDate: null, termDatePeriod: null, showTerminated: false } as any);
      component.removeFilterChip('effDate');
      expect(mockService.searchDriveLocations).toHaveBeenCalledTimes(2);
    });

    it('should clear all filters and reload', () => {
      component.ngOnInit();
      component.appliedFilters.set({ effDate: '2026-01-01', effDatePeriod: 'AFTER', termDate: null, termDatePeriod: null, showTerminated: true } as any);
      component.clearAllFilters();
      const filters = component.appliedFilters();
      expect(filters?.showTerminated).toBe(false);
      expect(filters?.effDate).toBeNull();
      expect(component.filterChips()).toEqual([]);
    });

    it('should reset pageIndex to 0 on clearAllFilters', () => {
      component.pageIndex = 3;
      component.clearAllFilters();
      expect(component.pageIndex).toBe(0);
    });

    it('should report hasActiveFilters true when filters applied', () => {
      component.appliedFilters.set({ effDate: '2026-01-01', effDatePeriod: 'AFTER', termDate: null, termDatePeriod: null, showTerminated: false } as any);
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should report hasActiveFilters false when no filters', () => {
      component.appliedFilters.set({ effDate: null, effDatePeriod: null, termDate: null, termDatePeriod: null, showTerminated: false } as any);
      expect(component.hasActiveFilters()).toBe(false);
    });
  });

  // ── Row Expansion ────────────────────────────────────────────────────────
  describe('Row Expansion', () => {
    it('should expand a row', () => {
      component.toggleRow(0);
      expect(component.isRowExpanded(0)).toBe(true);
    });

    it('should collapse an expanded row', () => {
      component.toggleRow(0);
      component.toggleRow(0);
      expect(component.isRowExpanded(0)).toBe(false);
    });

    it('should expand all rows', () => {
      component.dataSource.set([mockDriveLocation, { ...mockDriveLocation, locationId: 'LOCN002' }]);
      component.toggleAllRows();
      expect(component.isRowExpanded(0)).toBe(true);
      expect(component.isRowExpanded(1)).toBe(true);
      expect(component.allRowsExpanded).toBe(true);
    });

    it('should collapse all rows when already expanded', () => {
      component.dataSource.set([mockDriveLocation, { ...mockDriveLocation, locationId: 'LOCN002' }]);
      component.toggleAllRows(); // expand
      component.toggleAllRows(); // collapse
      expect(component.isRowExpanded(0)).toBe(false);
      expect(component.allRowsExpanded).toBe(false);
    });

    it('should return false for unexpanded row', () => {
      expect(component.isRowExpanded(99)).toBe(false);
    });
  });

  // ── Side Panel ───────────────────────────────────────────────────────────
  describe('Side Panel Management', () => {
    it('should open add panel with correct state', () => {
      component.openAddPanel();
      expect(component.isSidePanelOpen()).toBe(true);
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelView).toBe('form');
    });

    it('should open edit panel with location data', () => {
      component.openEditPanel(mockDriveLocation);
      expect(component.isSidePanelOpen()).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockDriveLocation);
      expect(component.sidePanelView).toBe('form');
    });

    it('should close side panel and reset state', () => {
      component.isSidePanelOpen.set(true);
      component.sidePanelData = mockDriveLocation;
      component.sidePanelView = 'international-address';
      component.internationalAddressRecordKey = 'REC1';
      component.appliedInternationalAddressData = { some: 'data' };

      component.closeSidePanel();

      expect(component.isSidePanelOpen()).toBe(false);
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelView).toBe('form');
      expect(component.internationalAddressRecordKey).toBeNull();
      expect(component.appliedInternationalAddressData).toBeNull();
    });

    it('should handle save success and reload data', () => {
      component.ngOnInit();
      component.openAddPanel();
      component.onSaveSuccess();
      expect(component.isSidePanelOpen()).toBe(false);
      expect(mockService.searchDriveLocations).toHaveBeenCalledTimes(2);
    });

    it('should open edit panel via onEdit and stop event propagation', () => {
      const event = { stopPropagation: jasmine.createSpy('stopPropagation') } as any;
      component.onEdit(mockDriveLocation, event);
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.isSidePanelOpen()).toBe(true);
    });

    it('should identify a row being edited', () => {
      component.openEditPanel(mockDriveLocation);
      expect(component.isRowBeingEdited(mockDriveLocation)).toBe(true);
    });

    it('should return false for row not being edited', () => {
      component.openEditPanel(mockDriveLocation);
      const other = { ...mockDriveLocation, locationId: 'OTHER' };
      expect(component.isRowBeingEdited(other)).toBe(false);
    });

    it('should return false isRowBeingEdited in add mode', () => {
      component.openAddPanel();
      expect(component.isRowBeingEdited(mockDriveLocation)).toBe(false);
    });
  });

  // ── International Address ────────────────────────────────────────────────
  describe('International Address Panel', () => {
    it('should open international address panel', () => {
      component.openInternationalAddress({ recordKey: 'LOCN001', hasUSAddressData: false });
      expect(component.sidePanelView).toBe('international-address');
      expect(component.internationalAddressRecordKey).toBe('LOCN001');
      expect(component.hasUSAddressData).toBe(false);
    });

    it('should store existing international data if provided', () => {
      const existingData = { intlAddrFlag: 'Y', intlAddress1: '123 St' };
      component.openInternationalAddress({ recordKey: 'LOCN001', hasUSAddressData: false, existingData });
      expect(component.appliedInternationalAddressData).toEqual(existingData);
    });

    it('should close international address and return to form view', () => {
      component.openInternationalAddress({ recordKey: 'LOCN001', hasUSAddressData: false });
      component.closeInternationalAddress();
      expect(component.sidePanelView).toBe('form');
      expect(component.internationalAddressRecordKey).toBeNull();
    });

    it('should store applied international address data and return to form', () => {
      const data = { intlAddrFlag: 'Y', intlAddress1: '10 Downing St' };
      component.onInternationalAddressApply(data);
      expect(component.appliedInternationalAddressData).toEqual(data);
      expect(component.sidePanelView).toBe('form');
    });
  });

  // ── View Operations ──────────────────────────────────────────────────────
  describe('View Operations', () => {
    it('should load and display contact address', () => {
      const mockDetails = {
        locationId: 'LOCN001', locationName: 'Test',
        address: { streetName: '123 Main St', city: 'Dallas', state: 'TX', zip: '75001', dAreaCode: '214', dPhoneNo: '5551234', email: 'test@example.com' },
        notes: [{ note: 'Test note' }]
      };
      mockService.getDriveLocationDetails.and.returnValue(of(mockDetails));
      component.onViewContactAddress(mockDriveLocation);
      expect(component.sidePanelView).toBe('view-contact-address');
      expect(component.isSidePanelOpen()).toBe(true);
    });

    it('should handle contact address load error', () => {
      mockService.getDriveLocationDetails.and.returnValue(throwError(() => new Error('fail')));
      component.onViewContactAddress(mockDriveLocation);
      expect(mockSnackBar.showError).toHaveBeenCalled();
    });

    it('should show specific error message when loading contact address fails', () => {
      mockService.getDriveLocationDetails.and.returnValue(throwError(() => new Error('fail')));
      component.onViewContactAddress(mockDriveLocation);
      expect(mockSnackBar.showError).toHaveBeenCalledWith('Error loading contact address details');
    });

    it('should build phone string with area code and extension', () => {
      const mockDetails = {
        address: { dAreaCode: '214', dPhoneNo: '5551234', extension: '100' }, notes: []
      };
      mockService.getDriveLocationDetails.and.returnValue(of(mockDetails));
      component.onViewContactAddress(mockDriveLocation);
      expect(component.viewContactAddressData?.address?.phone).toContain('214');
      expect(component.viewContactAddressData?.address?.phone).toContain('ext 100');
    });

    it('should format phone with extension correctly', () => {
      const mockDetails = {
        address: { dAreaCode: '214', dPhoneNo: '5551234', extension: '100' },
        notes: []
      };
      mockService.getDriveLocationDetails.and.returnValue(of(mockDetails));
      component.onViewContactAddress(mockDriveLocation);
      expect(component.viewContactAddressData.address.phone).toBe('214-5551234 ext 100');
    });

    it('should build fax string when both fax area code and number are present', () => {
      const mockDetails = {
        address: { fAreaCode: '972', fPhoneNo: '5559999' }, notes: []
      };
      mockService.getDriveLocationDetails.and.returnValue(of(mockDetails));
      component.onViewContactAddress(mockDriveLocation);
      const fax: string = component.viewContactAddressData?.address?.fax || '';
      expect(fax).toContain('972');
    });

    it('should format fax number correctly', () => {
      const mockDetails = {
        address: { fAreaCode: '972', fPhoneNo: '5554321' },
        notes: []
      };
      mockService.getDriveLocationDetails.and.returnValue(of(mockDetails));
      component.onViewContactAddress(mockDriveLocation);
      expect(component.viewContactAddressData.address.fax).toBe('972-5554321');
    });

    it('should handle missing address object in contact address', () => {
      mockService.getDriveLocationDetails.and.returnValue(of({ notes: [] }));
      component.onViewContactAddress(mockDriveLocation);
      expect(component.sidePanelView).toBe('view-contact-address');
    });

    it('should handle contact address with no notes array', () => {
      const mockDetails = { address: { streetName: 'Main St' }, notes: null };
      mockService.getDriveLocationDetails.and.returnValue(of(mockDetails));
      component.onViewContactAddress(mockDriveLocation);
      expect(component.viewContactAddressData.address.notes).toBe('');
    });

    it('should handle contact address with empty notes array', () => {
      const mockDetails = { address: { streetName: 'Main St' }, notes: [] };
      mockService.getDriveLocationDetails.and.returnValue(of(mockDetails));
      component.onViewContactAddress(mockDriveLocation);
      expect(component.viewContactAddressData.address.notes).toBe('');
    });

    it('should concatenate multiple notes with newlines', () => {
      const mockDetails = {
        address: {}, notes: [{ note: 'Note one' }, { note: 'Note two' }]
      };
      mockService.getDriveLocationDetails.and.returnValue(of(mockDetails));
      component.onViewContactAddress(mockDriveLocation);
      expect(component.viewContactAddressData?.address?.notes).toContain('Note one');
      expect(component.viewContactAddressData?.address?.notes).toContain('Note two');
    });

    it('should format multiple notes joined by double newline', () => {
      const mockDetails = {
        address: { streetName: 'Main St' },
        notes: [{ note: 'Note 1' }, { note: 'Note 2' }]
      };
      mockService.getDriveLocationDetails.and.returnValue(of(mockDetails));
      component.onViewContactAddress(mockDriveLocation);
      expect(component.viewContactAddressData.address.notes).toBe('Note 1\n\nNote 2');
    });

    it('should handle missing phone data gracefully', () => {
      const mockDetails = { address: {}, notes: [] };
      mockService.getDriveLocationDetails.and.returnValue(of(mockDetails));
      component.onViewContactAddress(mockDriveLocation);
      expect(component.viewContactAddressData.address.phone).toBe('');
      expect(component.viewContactAddressData.address.fax).toBe('');
    });

    it('should load and display international address', () => {
      const mockDetails = {
        address: { intlAddress1: '123 International St', countryName: 'Canada', intlPostalCode: 'M1M 1M1' }
      };
      mockService.getDriveLocationDetails.and.returnValue(of(mockDetails));
      component.onViewInternationalAddress(mockDriveLocation);
      expect(component.sidePanelView).toBe('view-international-address');
      expect(component.isSidePanelOpen()).toBe(true);
    });

    it('should handle international address load error', () => {
      mockService.getDriveLocationDetails.and.returnValue(throwError(() => new Error('fail')));
      component.onViewInternationalAddress(mockDriveLocation);
      expect(mockSnackBar.showError).toHaveBeenCalled();
    });

    it('should show specific error message when loading international address fails', () => {
      mockService.getDriveLocationDetails.and.returnValue(throwError(() => new Error('fail')));
      component.onViewInternationalAddress(mockDriveLocation);
      expect(mockSnackBar.showError).toHaveBeenCalledWith('Error loading international address details');
    });

    it('should handle missing address in international view', () => {
      mockService.getDriveLocationDetails.and.returnValue(of({}));
      component.onViewInternationalAddress(mockDriveLocation);
      expect(component.sidePanelView).toBe('view-international-address');
    });

    it('should map all international address fields', () => {
      const mockDetails = {
        address: {
          intlAddress1: 'Line1', intlAddress2: 'Line2', intlAddress3: 'Line3', intlAddress4: 'Line4',
          countryName: 'France', intlPostalCode: '75001',
          intlWorkPhoneNo: '123', intlWorkPhoneExt: '456',
          intlHomePhoneNo: '789', intlMobilePhoneNo: '012',
          intlFaxNo: '345', intlEmail: 'test@intl.com'
        }
      };
      mockService.getDriveLocationDetails.and.returnValue(of(mockDetails));
      component.onViewInternationalAddress(mockDriveLocation);
      const addr = component.viewInternationalAddressData?.address;
      expect(addr?.address1).toBe('Line1');
      expect(addr?.country).toBe('France');
      expect(addr?.email).toBe('test@intl.com');
    });

    it('should call getDriveLocationDetails on view direction', () => {
      mockService.getDriveLocationDetails.and.returnValue(of({ locationName: 'Test', siteDirections: 'Turn left' }));
      component.onViewDirection(mockDriveLocation);
      expect(mockService.getDriveLocationDetails).toHaveBeenCalledWith(mockDriveLocation.locationId, 'WAD');
    });

    it('should open dialog with direction data on success', () => {
      const dialogOpenSpy = spyOn(component['dialog'], 'open').and.returnValue({ afterClosed: () => of(null) } as any);
      const mockDetails = {
        locationName: 'Test Location',
        siteDirections: 'Turn left at the light'
      };
      mockService.getDriveLocationDetails.and.returnValue(of(mockDetails));

      component.onViewDirection(mockDriveLocation);

      expect(mockService.getDriveLocationDetails).toHaveBeenCalled();
      expect(dialogOpenSpy).toHaveBeenCalled();
    });

    it('should handle view direction error', () => {
      mockService.getDriveLocationDetails.and.returnValue(throwError(() => new Error('fail')));
      component.onViewDirection(mockDriveLocation);
      expect(mockSnackBar.showError).toHaveBeenCalled();
    });

    it('should show specific error message on direction load failure', () => {
      mockService.getDriveLocationDetails.and.returnValue(throwError(() => new Error('fail')));
      component.onViewDirection(mockDriveLocation);
      expect(mockSnackBar.showError).toHaveBeenCalledWith('Error loading direction details');
    });
  });

  // ── Formatting ───────────────────────────────────────────────────────────
  describe('Data Formatting', () => {
    it('should format a valid date', () => {
      const result = component.formatDate('2026-06-15');
      expect(result).toMatch(/15-JUN-2026/);
    });

    it('should return dash for undefined date', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should return dash for null date', () => {
      expect(component.formatDate('')).toBe('-');
    });

    it('should return dash for invalid date string', () => {
      expect(component.formatDate('not-a-date')).toBe('-');
    });

    it('should format a valid ISO datetime', () => {
      const result = component.formatDateTime('2026-06-15T14:30:00');
      expect(result).toContain('JUN');
    });

    it('should return dash for undefined datetime', () => {
      expect(component.formatDateTime(undefined)).toBe('-');
    });

    it('should format a valid datetime with time component', () => {
      const result = component.formatDateTime('2026-06-20T14:30:00');
      expect(result).toContain('2026');
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('should format time from ISO string', () => {
      // Uses browser local time — just verify it returns HH:MM format
      const result = component.formatTime('2000-01-01T08:30:00Z');
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should return dash for undefined time', () => {
      expect(component.formatTime(undefined)).toBe('-');
    });

    it('should return formatted time for valid input', () => {
      const result = component.formatTime('2026-06-15T14:45:00');
      expect(result).toBe('14:45');
    });

    it('should format rotation flag Y as Yes', () => {
      expect(component.formatRotationFlag('Y')).toBe('Yes');
    });

    it('should format rotation flag N as No', () => {
      expect(component.formatRotationFlag('N')).toBe('No');
    });

    it('should format lowercase y as Yes', () => {
      expect(component.formatRotationFlag('y')).toBe('Yes');
    });

    it('should return dash for undefined rotation flag', () => {
      expect(component.formatRotationFlag(undefined)).toBe('-');
    });

    it('should return No for any non-Y value', () => {
      expect(component.formatRotationFlag('X')).toBe('No');
    });
  });

  // ── Tooltip ──────────────────────────────────────────────────────────────
  describe('Tooltip Overflow', () => {
    it('should disable tooltip when content fits', () => {
      const el = { scrollWidth: 100, clientWidth: 200 } as HTMLElement;
      const tooltip = { disabled: false } as MatTooltip;
      component.showTooltipIfOverflowing(el, tooltip);
      expect(tooltip.disabled).toBe(true);
    });

    it('should enable tooltip when content overflows', () => {
      const el = { scrollWidth: 300, clientWidth: 100 } as HTMLElement;
      const tooltip = { disabled: true } as MatTooltip;
      component.showTooltipIfOverflowing(el, tooltip);
      expect(tooltip.disabled).toBe(false);
    });
  });

  // ── Build search params ──────────────────────────────────────────────────
  describe('buildSearchParams', () => {
    it('should include current chapterId', () => {
      component.loadData();
      const [, , params] = mockService.searchDriveLocations.calls.mostRecent().args;
      expect(params.chapterId).toBe('WAD');
    });

    it('should include searchKeyword when set', () => {
      component.searchText.set('test');
      component.loadData();
      const [, , params] = mockService.searchDriveLocations.calls.mostRecent().args;
      expect(params.searchKeyword).toBe('test');
    });

    it('should include sort field and direction', () => {
      component.sortField = 'locationType';
      component.sortDirection = 'DESC';
      component.loadData();
      const [, , params] = mockService.searchDriveLocations.calls.mostRecent().args;
      expect(params.sortField).toBe('locationType');
      expect(params.sortDirection).toBe('DESC');
    });

    it('should pass showTerminated from filters', () => {
      component.appliedFilters.set({ effDate: null, effDatePeriod: null, termDate: null, termDatePeriod: null, showTerminated: true } as any);
      component.loadData();
      const [, , params] = mockService.searchDriveLocations.calls.mostRecent().args;
      expect(params.showTerminated).toBe(true);
    });

    it('should default showTerminated to false when no filters', () => {
      component.appliedFilters.set(null);
      component.loadData();
      const [, , params] = mockService.searchDriveLocations.calls.mostRecent().args;
      expect(params.showTerminated).toBe(false);
    });
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────
  describe('Lifecycle', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      const spy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should subscribe to chapter changes on init', () => {
      component.ngOnInit();
      // Chapter change fires — no error should be thrown
      expect(() => chapterChanged$.next()).not.toThrow();
    });
  });

  // ── Additional Coverage ──────────────────────────────────────────────────
  describe('Additional Coverage', () => {

    describe('removeFilterChip null-guard branch', () => {
      it('should not call loadData when appliedFilters is null', () => {
        component.appliedFilters.set(null);
        mockService.searchDriveLocations.calls.reset();

        component.removeFilterChip('effDate');

        expect(mockService.searchDriveLocations).not.toHaveBeenCalled();
      });
    });

    describe('formatRotationFlag edge cases', () => {
      it('should return dash for empty string flag', () => {
        expect(component.formatRotationFlag('')).toBe('-');
      });
    });

  });
});
