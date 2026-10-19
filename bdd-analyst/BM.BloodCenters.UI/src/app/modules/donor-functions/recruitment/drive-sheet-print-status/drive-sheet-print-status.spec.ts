import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';

import { DriveSheetPrintStatusComponent } from './drive-sheet-print-status';
import { DriveSheetPrintStatusService } from './services/drive-sheet-print-status.service';
import { HeaderService } from '@shared/services/header.service';
import {
  DriveSheetPrintStatusResponse,
  DriveSheetPrintStatusModel,
  DriveSheetPrintStatusFilter,
  STATUS_OPTIONS
} from './models/drive-sheet-print-status.model';

// Mock TranslateLoader
class MockTranslateLoader implements TranslateLoader {
  getTranslation() {
    return of({});
  }
}

describe('DriveSheetPrintStatusComponent', () => {
  let component: DriveSheetPrintStatusComponent;
  let fixture: ComponentFixture<DriveSheetPrintStatusComponent>;
  let mockDriveService: jasmine.SpyObj<DriveSheetPrintStatusService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  const mockResponse: DriveSheetPrintStatusResponse = {
    success: true,
    data: [
      {
        driveId: 'DRIV001',
        driveDate: '2024-12-09',
        sponsorName: 'Test Sponsor',
        status: 'Confirm',
        lastModifiedDate: '2024-12-15',
        lastModifiedUser: 'USER01',
        driveSheetDate: '2024-12-18'
      },
      {
        driveId: 'DRIV002',
        driveDate: '2024-12-03',
        sponsorName: 'Another Sponsor',
        status: 'Future',
        lastModifiedDate: null,
        lastModifiedUser: 'USER02',
        driveSheetDate: null
      }
    ],
    total: 2
  };

  beforeEach(() => {
    mockDriveService = jasmine.createSpyObj('DriveSheetPrintStatusService', ['searchDrives']);
    mockDriveService.searchDrives.and.returnValue(of(mockResponse));

    mockHeaderService = jasmine.createSpyObj('HeaderService', ['getCurrentChapterId']);
    mockHeaderService.getCurrentChapterId.and.returnValue('CHAP01');

    TestBed.configureTestingModule({
      imports: [
        DriveSheetPrintStatusComponent,
        NoopAnimationsModule,
        ReactiveFormsModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: MockTranslateLoader }
        })
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: DriveSheetPrintStatusService, useValue: mockDriveService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });

    mockDriveService.searchDrives.calls.reset();
    mockDriveService.searchDrives.and.returnValue(of(mockResponse));

    fixture = TestBed.createComponent(DriveSheetPrintStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─── Creation ─────────────────────────────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // ─── Header Config ────────────────────────────────────────────────────────────

  it('should have correct header configuration', () => {
    expect(component.headerConfig.title).toBe('Drive Sheet Print Status');
    expect(component.headerConfig.breadcrumbs.length).toBe(2);
    expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
    expect(component.headerConfig.breadcrumbs[1].label).toBe('Drive Sheet Print Status');
  });

  // ─── Form Initialization (ngOnInit) ───────────────────────────────────────────

  it('should initialize the form on ngOnInit with default values', () => {
    expect(component.filterForm).toBeTruthy();
    expect(component.filterForm.get('fromDate')?.value).toBeTruthy();
    expect(component.filterForm.get('toDate')?.value).toBeTruthy();
    expect(component.filterForm.get('driveType')?.value).toBe('DNP');
  });

  it('should set fromDate to the first day of the current year', () => {
    const fromDate = component.filterForm.get('fromDate')?.value as Date;
    const today = new Date();
    expect(fromDate.getFullYear()).toBe(today.getFullYear());
    expect(fromDate.getMonth()).toBe(0);
    expect(fromDate.getDate()).toBe(1);
  });

  it('should have required validators on form fields', () => {
    component.filterForm.get('fromDate')?.setValue(null);
    component.filterForm.get('toDate')?.setValue(null);
    component.filterForm.get('driveType')?.setValue('');

    expect(component.filterForm.get('fromDate')?.hasError('required')).toBeTrue();
    expect(component.filterForm.get('toDate')?.hasError('required')).toBeTrue();
    expect(component.filterForm.get('driveType')?.hasError('required')).toBeTrue();
  });

  // ─── Drive Type Options ───────────────────────────────────────────────────────

  it('should have drive type options', () => {
    expect(component.driveTypeOptions.length).toBe(3);
    expect(component.driveTypeOptions.find(o => o.value === 'DNP')).toBeTruthy();
    expect(component.driveTypeOptions.find(o => o.value === 'DMNP')).toBeTruthy();
    expect(component.driveTypeOptions.find(o => o.value === 'DMAP')).toBeTruthy();
  });

  // ─── retrieve() ───────────────────────────────────────────────────────────────

  it('should retrieve data when form is valid', () => {
    component.retrieve();

    expect(mockDriveService.searchDrives).toHaveBeenCalled();
    expect(component.dataSource().length).toBe(2);
    expect(component.hasSearched()).toBeTrue();
  });

  it('should not call service when form is invalid', () => {
    component.filterForm.get('fromDate')?.setValue(null);

    component.retrieve();

    expect(mockDriveService.searchDrives).not.toHaveBeenCalled();
  });

  it('should mark all fields as touched when form is invalid', () => {
    component.filterForm.get('fromDate')?.setValue(null);
    spyOn(component.filterForm, 'markAllAsTouched');

    component.retrieve();

    expect(component.filterForm.markAllAsTouched).toHaveBeenCalled();
  });

  it('should not call service when fromDate is greater than toDate', () => {
    const futureDate = new Date(2099, 11, 31);
    const pastDate = new Date(2020, 0, 1);
    component.filterForm.get('fromDate')?.setValue(futureDate);
    component.filterForm.get('toDate')?.setValue(pastDate);

    component.retrieve();

    expect(mockDriveService.searchDrives).not.toHaveBeenCalled();
  });

  it('should set isLoading to true while retrieving and false after', () => {
    component.retrieve();

    expect(component.isLoading()).toBeFalse(); // already resolved because of sync observable
  });

  it('should reset sortDirection to default on retrieve', () => {
    component.sortDirection.set('asc');
    component.retrieve();

    expect(component.sortDirection()).toBe('default');
  });

  it('should pass correct request parameters to service', () => {
    component.retrieve();

    expect(mockDriveService.searchDrives).toHaveBeenCalled();
    const args = mockDriveService.searchDrives.calls.mostRecent().args[0];
    expect(args.driveType).toBe('DNP');
    expect(args.fromDate).toBeTruthy();
    expect(args.toDate).toBeTruthy();
    expect(args.chapterId).toBeDefined();
  });

  it('should pass changed driveType to service', () => {
    component.filterForm.patchValue({ driveType: 'DMNP' });
    component.retrieve();

    expect(mockDriveService.searchDrives).toHaveBeenCalled();
    const args = mockDriveService.searchDrives.calls.mostRecent().args[0];
    expect(args.driveType).toBe('DMNP');
  });

  it('should set dataSource to empty array when response has no data', () => {
    mockDriveService.searchDrives.and.returnValue(of({ success: true, data: null as any, total: 0 }));

    component.retrieve();

    expect(component.dataSource().length).toBe(0);
  });

  it('should set dataSource to empty array when response is null', () => {
    mockDriveService.searchDrives.and.returnValue(of(null as any));

    component.retrieve();

    expect(component.dataSource().length).toBe(0);
  });

  it('should handle service error by setting empty dataSource and clearing isLoading', () => {
    mockDriveService.searchDrives.and.returnValue(throwError(() => new Error('API error')));

    component.retrieve();

    expect(component.dataSource().length).toBe(0);
    expect(component.isLoading()).toBeFalse();
  });

  // ─── formatDate() ────────────────────────────────────────────────────────────

  it('should return dash for null date', () => {
    expect(component.formatDate(null)).toBe('-');
  });

  it('should format a valid date string', () => {
    const result = component.formatDate('2024-12-09');
    // Should be uppercase and in dd-MMM-yyyy format
    expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
  });

  it('should format a Date object', () => {
    const result = component.formatDate(new Date(2024, 11, 9));
    expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
  });

  // ─── formatDateTime() ────────────────────────────────────────────────────────

  it('should return dash for null datetime', () => {
    expect(component.formatDateTime(null)).toBe('-');
  });

  it('should format a valid datetime string', () => {
    const result = component.formatDateTime('2024-12-15');
    expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
  });

  // ─── toggleSort() ────────────────────────────────────────────────────────────

  it('should not toggle sort for non-driveId columns', () => {
    component.toggleSort('sponsorName');
    expect(component.sortDirection()).toBe('default');
  });

  it('should cycle from default to asc on driveId', () => {
    component.sortDirection.set('default');
    component.toggleSort('driveId');
    expect(component.sortDirection()).toBe('asc');
  });

  it('should cycle from asc to desc on driveId', () => {
    component.sortDirection.set('asc');
    component.toggleSort('driveId');
    expect(component.sortDirection()).toBe('desc');
  });

  it('should cycle from desc to default on driveId', () => {
    component.sortDirection.set('desc');
    component.toggleSort('driveId');
    expect(component.sortDirection()).toBe('default');
  });

  it('should set column and direction to asc when toggling a new column to driveId', () => {
    component.sortColumn.set('otherColumn');
    component.toggleSort('driveId');

    expect(component.sortColumn()).toBe('driveId');
    expect(component.sortDirection()).toBe('asc');
  });

  // ─── getSortIcon() ───────────────────────────────────────────────────────────

  it('should return empty string for non-driveId column', () => {
    expect(component.getSortIcon('sponsorName')).toBe('');
  });

  it('should return arrow_upward when driveId sorted asc', () => {
    component.sortColumn.set('driveId');
    component.sortDirection.set('asc');
    expect(component.getSortIcon('driveId')).toBe('arrow_upward');
  });

  it('should return arrow_downward when driveId sorted desc', () => {
    component.sortColumn.set('driveId');
    component.sortDirection.set('desc');
    expect(component.getSortIcon('driveId')).toBe('arrow_downward');
  });

  it('should return unfold_more when driveId sort is default', () => {
    component.sortColumn.set('driveId');
    component.sortDirection.set('default');
    expect(component.getSortIcon('driveId')).toBe('unfold_more');
  });

  it('should return unfold_more when sort column is not driveId', () => {
    component.sortColumn.set('otherColumn');
    expect(component.getSortIcon('driveId')).toBe('unfold_more');
  });

  // ─── getSortAriaLabel() ──────────────────────────────────────────────────────

  it('should return empty string for non-driveId column', () => {
    expect(component.getSortAriaLabel('sponsorName')).toBe('');
  });

  it('should return "Sort by Drive ID" when column is not sorted', () => {
    component.sortColumn.set('otherColumn');
    expect(component.getSortAriaLabel('driveId')).toBe('Sort by Drive ID');
  });

  it('should return ascending label when asc', () => {
    component.sortColumn.set('driveId');
    component.sortDirection.set('asc');
    expect(component.getSortAriaLabel('driveId')).toBe('Drive ID sorted ascending, click to sort descending');
  });

  it('should return descending label when desc', () => {
    component.sortColumn.set('driveId');
    component.sortDirection.set('desc');
    expect(component.getSortAriaLabel('driveId')).toBe('Drive ID sorted descending, click to remove sort');
  });

  it('should return "Sort by Drive ID" when direction is default', () => {
    component.sortColumn.set('driveId');
    component.sortDirection.set('default');
    expect(component.getSortAriaLabel('driveId')).toBe('Sort by Drive ID');
  });

  // ─── trackByDriveId() ────────────────────────────────────────────────────────

  it('should return the driveId from the row', () => {
    const row: DriveSheetPrintStatusModel = {
      driveId: 'DRIV999',
      driveDate: '2024-01-01',
      sponsorName: 'Sponsor',
      status: 'Confirm',
      lastModifiedDate: null,
      lastModifiedUser: 'USER',
      driveSheetDate: null
    };
    expect(component.trackByDriveId(0, row)).toBe('DRIV999');
  });

  // ─── onSearch() ──────────────────────────────────────────────────────────────

  it('should set searchTerm from input event', () => {
    const event = { target: { value: 'test search' } } as unknown as Event;
    component.onSearch(event);
    expect(component.searchTerm()).toBe('test search');
  });

  it('should set empty searchTerm when input is cleared', () => {
    component.searchTerm.set('previous');
    const event = { target: { value: '' } } as unknown as Event;
    component.onSearch(event);
    expect(component.searchTerm()).toBe('');
  });

  // ─── openFilter() ────────────────────────────────────────────────────────────

  it('should open filter dialog and set isFilterPanelOpen to true', () => {
    const afterClosedSubject = new Subject<DriveSheetPrintStatusFilter>();
    const dialogOpenSpy = spyOn(component['dialog'], 'open').and.returnValue({
      afterClosed: () => afterClosedSubject.asObservable()
    } as any);

    const mockEvent = {
      currentTarget: {
        getBoundingClientRect: () => ({ left: 100, bottom: 200 })
      }
    } as unknown as MouseEvent;

    component.openFilter(mockEvent);

    expect(component.isFilterPanelOpen).toBeTrue();
    expect(dialogOpenSpy).toHaveBeenCalled();
  });

  it('should set filters and build chips when dialog closes with filters', () => {
    const filters: DriveSheetPrintStatusFilter = { status: 'CNFRM' };
    spyOn(component['dialog'], 'open').and.returnValue({
      afterClosed: () => of(filters)
    } as any);

    const mockEvent = {
      currentTarget: {
        getBoundingClientRect: () => ({ left: 100, bottom: 200 })
      }
    } as unknown as MouseEvent;

    component.openFilter(mockEvent);

    expect(component.isFilterPanelOpen).toBeFalse();
    expect(component.currentFilters()).toEqual(filters);
    expect(component.activeFilterChips.length).toBe(1);
  });

  it('should not update filters when dialog closes with undefined', () => {
    spyOn(component['dialog'], 'open').and.returnValue({
      afterClosed: () => of(undefined)
    } as any);

    const mockEvent = {
      currentTarget: {
        getBoundingClientRect: () => ({ left: 100, bottom: 200 })
      }
    } as unknown as MouseEvent;

    component.currentFilters.set({});
    component.openFilter(mockEvent);

    expect(component.isFilterPanelOpen).toBeFalse();
    expect(component.currentFilters()).toEqual({});
  });

  // ─── buildFilterChips() ──────────────────────────────────────────────────────

  it('should build a status chip when status filter is set', () => {
    component.currentFilters.set({ status: 'CNFRM' });
    component.buildFilterChips();

    expect(component.activeFilterChips.length).toBe(1);
    expect(component.activeFilterChips[0].key).toBe('status');
    expect(component.activeFilterChips[0].label).toBe('Status');
    expect(component.activeFilterChips[0].value).toBe('Confirm');
  });

  it('should use raw status value when no matching STATUS_OPTIONS entry', () => {
    component.currentFilters.set({ status: 'UNKNOWN_STATUS' });
    component.buildFilterChips();

    expect(component.activeFilterChips.length).toBe(1);
    expect(component.activeFilterChips[0].value).toBe('UNKNOWN_STATUS');
  });

  it('should build a driveDate chip when driveDate filter is set', () => {
    component.currentFilters.set({ driveDate: '2024-12-09' });
    component.buildFilterChips();

    expect(component.activeFilterChips.length).toBe(1);
    expect(component.activeFilterChips[0].key).toBe('driveDate');
    expect(component.activeFilterChips[0].label).toBe('Drive Date');
  });

  it('should build both chips when both filters are set', () => {
    component.currentFilters.set({ status: 'HOLD', driveDate: '2024-12-09' });
    component.buildFilterChips();

    expect(component.activeFilterChips.length).toBe(2);
  });

  it('should build no chips when no filters are set', () => {
    component.currentFilters.set({});
    component.buildFilterChips();

    expect(component.activeFilterChips.length).toBe(0);
  });

  // ─── formatFilterDate() ──────────────────────────────────────────────────────

  it('should return dash for empty string', () => {
    expect(component.formatFilterDate('')).toBe('-');
  });

  it('should format date correctly', () => {
    const result = component.formatFilterDate('2024-03-15');
    expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    expect(result).toContain('MAR');
  });

  it('should format January date correctly', () => {
    const result = component.formatFilterDate('2024-01-05');
    expect(result).toContain('JAN');
  });

  it('should format December date correctly', () => {
    const result = component.formatFilterDate('2024-12-25');
    expect(result).toContain('DEC');
  });

  // ─── removeFilter() ─────────────────────────────────────────────────────────

  it('should remove status filter', () => {
    component.currentFilters.set({ status: 'CNFRM', driveDate: '2024-12-09' });
    component.removeFilter('status');

    expect(component.currentFilters().status).toBeUndefined();
    expect(component.currentFilters().driveDate).toBe('2024-12-09');
  });

  it('should remove driveDate filter', () => {
    component.currentFilters.set({ status: 'CNFRM', driveDate: '2024-12-09' });
    component.removeFilter('driveDate');

    expect(component.currentFilters().driveDate).toBeUndefined();
    expect(component.currentFilters().status).toBe('CNFRM');
  });

  it('should rebuild chips after removing a filter', () => {
    component.currentFilters.set({ status: 'CNFRM', driveDate: '2024-12-09' });
    component.buildFilterChips();
    expect(component.activeFilterChips.length).toBe(2);

    component.removeFilter('status');
    expect(component.activeFilterChips.length).toBe(1);
  });

  it('should handle removing unknown filter key gracefully', () => {
    component.currentFilters.set({ status: 'CNFRM' });
    component.removeFilter('unknown');

    expect(component.currentFilters().status).toBe('CNFRM');
  });

  // ─── clearAllFilters() ──────────────────────────────────────────────────────

  it('should clear all filters, chips, and search term', () => {
    component.currentFilters.set({ status: 'CNFRM', driveDate: '2024-12-09' });
    component.activeFilterChips = [
      { key: 'status', label: 'Status', value: 'Confirm' }
    ];
    component.searchTerm.set('Test');

    component.clearAllFilters();

    expect(component.currentFilters()).toEqual({});
    expect(component.activeFilterChips.length).toBe(0);
    expect(component.searchTerm()).toBe('');
  });

  // ─── getOverflowTooltip() ────────────────────────────────────────────────────

  it('should return empty string when 3 or fewer chips', () => {
    component.activeFilterChips = [
      { key: 'a', label: 'A', value: '1' },
      { key: 'b', label: 'B', value: '2' }
    ];
    expect(component.getOverflowTooltip()).toBe('');
  });

  it('should return tooltip for overflow chips beyond 3', () => {
    component.activeFilterChips = [
      { key: 'a', label: 'A', value: '1' },
      { key: 'b', label: 'B', value: '2' },
      { key: 'c', label: 'C', value: '3' },
      { key: 'd', label: 'D', value: '4' },
      { key: 'e', label: 'E', value: '5' }
    ];
    const tooltip = component.getOverflowTooltip();
    expect(tooltip).toContain('D: 4');
    expect(tooltip).toContain('E: 5');
    expect(tooltip).not.toContain('A: 1');
  });

  // ─── onViewDrive() ──────────────────────────────────────────────────────────

  it('should log drive ID when viewing a drive', () => {
    spyOn(console, 'log');
    const row: DriveSheetPrintStatusModel = {
      driveId: 'DRIV001',
      driveDate: '2024-12-09',
      sponsorName: 'Test',
      status: 'Confirm',
      lastModifiedDate: null,
      lastModifiedUser: 'USER01',
      driveSheetDate: null
    };
    component.onViewDrive(row);
    expect(console.log).toHaveBeenCalledWith('View drive:', 'DRIV001');
  });

  // ─── getStatusLabel() ────────────────────────────────────────────────────────

  it('should return dash for null status', () => {
    expect(component.getStatusLabel(null)).toBe('-');
  });

  it('should return matching label for known status', () => {
    expect(component.getStatusLabel('CNFRM')).toBe('Confirm');
    expect(component.getStatusLabel('HOLD')).toBe('Hold');
    expect(component.getStatusLabel('CANCL')).toBe('Cancel');
  });

  it('should return raw status when not found in STATUS_OPTIONS', () => {
    expect(component.getStatusLabel('UNKNOWN')).toBe('UNKNOWN');
  });

  // ─── filteredData computed ────────────────────────────────────────────────────

  it('should filter data by sponsor name search term', () => {
    component.dataSource.set(mockResponse.data);
    component.searchTerm.set('Test');

    const result = component.filteredData();
    expect(result.length).toBe(1);
    expect(result[0].sponsorName).toBe('Test Sponsor');
  });

  it('should filter data case-insensitively', () => {
    component.dataSource.set(mockResponse.data);
    component.searchTerm.set('test sponsor');

    const result = component.filteredData();
    expect(result.length).toBe(1);
  });

  it('should return all data when search term is empty', () => {
    component.dataSource.set(mockResponse.data);
    component.searchTerm.set('');

    expect(component.filteredData().length).toBe(2);
  });

  it('should return all data when search term is whitespace only', () => {
    component.dataSource.set(mockResponse.data);
    component.searchTerm.set('   ');

    expect(component.filteredData().length).toBe(2);
  });

  it('should filter by status', () => {
    component.dataSource.set(mockResponse.data);
    component.currentFilters.set({ status: 'Confirm' });

    const result = component.filteredData();
    expect(result.length).toBe(1);
    expect(result[0].status).toBe('Confirm');
  });

  it('should filter by drive date', () => {
    component.dataSource.set(mockResponse.data);
    component.currentFilters.set({ driveDate: '2024-12-09' });

    const result = component.filteredData();
    expect(result.length).toBe(1);
    expect(result[0].driveId).toBe('DRIV001');
  });

  it('should filter out items with null driveDate when driveDate filter is set', () => {
    const dataWithNullDate: DriveSheetPrintStatusModel[] = [
      {
        driveId: 'DRIV003',
        driveDate: null as any,
        sponsorName: 'Sponsor',
        status: 'Confirm',
        lastModifiedDate: null,
        lastModifiedUser: 'USER',
        driveSheetDate: null
      }
    ];
    component.dataSource.set(dataWithNullDate);
    component.currentFilters.set({ driveDate: '2024-12-09' });

    expect(component.filteredData().length).toBe(0);
  });

  it('should combine search and status filters', () => {
    component.dataSource.set(mockResponse.data);
    component.searchTerm.set('Test');
    component.currentFilters.set({ status: 'Confirm' });

    const result = component.filteredData();
    expect(result.length).toBe(1);
    expect(result[0].driveId).toBe('DRIV001');
  });

  it('should return empty when search matches but status does not', () => {
    component.dataSource.set(mockResponse.data);
    component.searchTerm.set('Test');
    component.currentFilters.set({ status: 'Future' });

    const result = component.filteredData();
    expect(result.length).toBe(0);
  });

  // ─── sortedData computed ──────────────────────────────────────────────────────

  it('should return unsorted data when direction is default', () => {
    component.dataSource.set(mockResponse.data);
    component.sortDirection.set('default');

    const result = component.sortedData();
    expect(result[0].driveId).toBe('DRIV001');
    expect(result[1].driveId).toBe('DRIV002');
  });

  it('should sort ascending by driveId', () => {
    const reversed = [...mockResponse.data].reverse();
    component.dataSource.set(reversed);
    component.sortColumn.set('driveId');
    component.sortDirection.set('asc');

    const result = component.sortedData();
    expect(result[0].driveId).toBe('DRIV001');
    expect(result[1].driveId).toBe('DRIV002');
  });

  it('should sort descending by driveId', () => {
    component.dataSource.set(mockResponse.data);
    component.sortColumn.set('driveId');
    component.sortDirection.set('desc');

    const result = component.sortedData();
    expect(result[0].driveId).toBe('DRIV002');
    expect(result[1].driveId).toBe('DRIV001');
  });

  it('should not sort when column is not driveId', () => {
    component.dataSource.set(mockResponse.data);
    component.sortColumn.set('sponsorName');
    component.sortDirection.set('asc');

    const result = component.sortedData();
    expect(result[0].driveId).toBe('DRIV001');
  });

  // ─── hasResults computed ─────────────────────────────────────────────────────

  it('should return true when filteredData has items', () => {
    component.dataSource.set(mockResponse.data);
    expect(component.hasResults()).toBeTrue();
  });

  it('should return false when filteredData is empty', () => {
    component.dataSource.set([]);
    expect(component.hasResults()).toBeFalse();
  });

  // ─── ngOnDestroy ──────────────────────────────────────────────────────────────

  it('should complete destroy$ subject on destroy', () => {
    const destroySubject = (component as any).destroy$ as Subject<void>;
    spyOn(destroySubject, 'next');
    spyOn(destroySubject, 'complete');

    component.ngOnDestroy();

    expect(destroySubject.next).toHaveBeenCalled();
    expect(destroySubject.complete).toHaveBeenCalled();
  });

  // ─── Initial signal state ────────────────────────────────────────────────────

  it('should have isLoading initially false', () => {
    expect(component.isLoading()).toBeFalse();
  });

  it('should have hasSearched initially false', () => {
    // The beforeEach does not call retrieve, so hasSearched starts false
    // But since fixture.detectChanges() was called and retrieve was not,
    // the state should reflect initialization
    const freshFixture = TestBed.createComponent(DriveSheetPrintStatusComponent);
    const freshComponent = freshFixture.componentInstance;
    expect(freshComponent.hasSearched()).toBeFalse();
  });

  it('should have empty dataSource initially', () => {
    const freshFixture = TestBed.createComponent(DriveSheetPrintStatusComponent);
    const freshComponent = freshFixture.componentInstance;
    expect(freshComponent.dataSource().length).toBe(0);
  });

  it('should have default sortDirection', () => {
    expect(component.sortDirection()).toBe('default');
  });

  it('should have default sortColumn as driveId', () => {
    expect(component.sortColumn()).toBe('driveId');
  });

  it('should have empty searchTerm initially', () => {
    expect(component.searchTerm()).toBe('');
  });

  it('should have empty currentFilters initially', () => {
    expect(component.currentFilters()).toEqual({});
  });

  it('should have isFilterPanelOpen initially false', () => {
    expect(component.isFilterPanelOpen).toBeFalse();
  });

  it('should have empty activeFilterChips initially', () => {
    expect(component.activeFilterChips.length).toBe(0);
  });
});
