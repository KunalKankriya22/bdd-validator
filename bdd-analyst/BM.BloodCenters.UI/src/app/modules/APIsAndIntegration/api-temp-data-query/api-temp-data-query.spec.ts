import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiTempDataQuery } from './api-temp-data-query';
import { ApiTempDataQueryService } from './services/api-temp-data-query.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { RouteKey } from 'src/app/core/constants/route-keys';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';

describe('ApiTempDataQuery', () => {
  let pageHeaderServiceSpy: any;
  let apiTempDataQueryServiceSpy: any;
  let component: ApiTempDataQuery;
  let fixture: ComponentFixture<ApiTempDataQuery>;
  let apiTempDataQueryService: jasmine.SpyObj<ApiTempDataQueryService>;
  let pageHeaderService: jasmine.SpyObj<PageHeaderService>;

  const mockIdTypes = [
    { code: 'APITY1', description: 'Type 1' },
    { code: 'APITY2', description: 'Type 2' }
  ];

  const mockTemporaryIds = [
    { temporaryId: 'TEMP001' },
    { temporaryId: 'TEMP002' }
  ];

  const mockPermanentIds = [
    { permanentId: 'PERM001' },
    { permanentId: 'PERM002' }
  ];

  const mockSourceIds = [
    { sourceId: 'LAP' },
    { sourceId: 'SFA' }
  ];

  const mockApiTempData = {
    data: [
      {
        temporaryId: 'TEMP001',
        permanentId: 'PERM001',
        idType: 'APITY1',
        temporaryAuditKey: 12345,
        permanentAuditKey: 67890,
        sourceId: 'SFA',
        insertDate: '2024-01-15T10:30:00'
      }
    ],
    total: 1
  };

  beforeEach(() => {
    apiTempDataQueryServiceSpy = jasmine.createSpyObj('ApiTempDataQueryService', [
      'getIdTypes',
      'getSourceIds',
      'getTemporaryIds',
      'getPermanentIds',
      'queryApiTempData'
    ]);
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [
      'getTitle',
      'getSubtitle',
      'getCurrentMenuItem'
    ], {
      pageHeaderData: jasmine.createSpy('pageHeaderData').and.returnValue(null)
    });

    TestBed.configureTestingModule({
      imports: [
        ApiTempDataQuery,
        ReactiveFormsModule,
        MatSnackBarModule,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideRouter([]),
        { provide: ApiTempDataQueryService, useValue: apiTempDataQueryServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    apiTempDataQueryServiceSpy.getIdTypes.calls.reset();
    apiTempDataQueryServiceSpy.getSourceIds.calls.reset();
    apiTempDataQueryServiceSpy.getTemporaryIds.calls.reset();
    apiTempDataQueryServiceSpy.getPermanentIds.calls.reset();
    apiTempDataQueryServiceSpy.queryApiTempData.calls.reset();
    pageHeaderServiceSpy.getTitle.calls.reset();
    pageHeaderServiceSpy.getSubtitle.calls.reset();
    pageHeaderServiceSpy.getCurrentMenuItem.calls.reset();

    apiTempDataQueryService = TestBed.inject(ApiTempDataQueryService) as jasmine.SpyObj<ApiTempDataQueryService>;
    pageHeaderService = TestBed.inject(PageHeaderService) as jasmine.SpyObj<PageHeaderService>;

    // Set up default return values
    apiTempDataQueryService.getIdTypes.and.returnValue(of(mockIdTypes));
    apiTempDataQueryService.getSourceIds.and.returnValue(of(mockSourceIds));
    apiTempDataQueryService.getTemporaryIds.and.returnValue(of(mockTemporaryIds));
    apiTempDataQueryService.getPermanentIds.and.returnValue(of(mockPermanentIds));

    fixture = TestBed.createComponent(ApiTempDataQuery);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should populate ID type dropdown on init and leave temp/perm IDs empty', () => {
    expect(component.idTypes).toEqual(mockIdTypes);
    expect(component.temporaryIds).toEqual([]);
    expect(component.permanentIds).toEqual([]);
  });

  it('should reset form values on reset', () => {
    // Set form values
    component.filterForm.patchValue({
      fromDate: new Date('2024-01-01'),
      toDate: new Date('2024-01-31'),
      idType: 'APITY1',
      temporaryId: 'TEMP001',
      permanentId: 'PERM001',
      sourceId: 'SFA',
      periodType: 'after',
      insertDate: new Date('2024-01-15')
    });

    // Trigger reset
    component.onReset();

    // Verify form is reset
    expect(component.filterForm.value).toEqual({
      fromDate: null,
      toDate: null,
      idType: '',
      temporaryId: '',
      permanentId: '',
      sourceId: '',
      periodType: '',
      insertDate: null
    });
    expect(component.dataSource).toEqual([]);
    expect(component.filteredDataSource).toEqual([]);
    expect(component.showEmptyState).toBe(true);
    expect(component.tableConfig.pagination?.totalRecords).toBe(0);
  });

  it('should enable search button when at least one field has data', () => {
    // Initially enabled (no dates set - valid state)
    expect(component.isSearchDisabled).toBe(false);

    // Disabled when only fromDate has value (requires both dates)
    component.filterForm.patchValue({ fromDate: new Date() });
    expect(component.isSearchDisabled).toBe(true);

    // Enabled when both fromDate and toDate have values
    component.filterForm.patchValue({ fromDate: new Date(), toDate: new Date() });
    expect(component.isSearchDisabled).toBe(false);

    // Reset form - enabled again with no dates
    component.filterForm.reset();
    expect(component.isSearchDisabled).toBe(false);
  });

  it('should update dataSource after successful search', () => {
    apiTempDataQueryService.queryApiTempData.and.returnValue(of(mockApiTempData));

    component.filterForm.patchValue({
      fromDate: new Date('2024-01-01'),
      toDate: new Date('2024-01-31')
    });

    component.onSearch();

    expect(component.dataSource).toEqual(mockApiTempData.data);
    expect(component.filteredDataSource).toEqual(mockApiTempData.data);
    expect(component.showEmptyState).toBe(false);
    expect(component.tableConfig.pagination?.totalRecords).toBe(1);
  });

  it('should clear data on error', () => {
    const errorResponse = {
      errorResponse: {
        errorCode: '16161',
        error: 'Invalid date range'
      }
    };

    apiTempDataQueryService.queryApiTempData.and.returnValue(throwError(() => errorResponse));

    // Set initial data
    component.dataSource = mockApiTempData.data;
    component.filteredDataSource = mockApiTempData.data;

    component.filterForm.patchValue({
      fromDate: new Date('2024-01-01'),
      toDate: new Date('2024-01-31')
    });

    component.onSearch();

    // Verify data is cleared
    expect(component.dataSource).toEqual([]);
    expect(component.filteredDataSource).toEqual([]);
    expect(component.tableConfig.pagination?.totalRecords).toBe(0);
  });

  it('should hide empty state after data load', () => {
    apiTempDataQueryService.queryApiTempData.and.returnValue(of(mockApiTempData));

    component.filterForm.patchValue({
      fromDate: new Date('2024-01-01'),
      toDate: new Date('2024-01-31')
    });

    component.onSearch();

    expect(component.showEmptyState).toBe(false);
  });

  it('should reload data when removing a filter chip while other filters remain', () => {
    apiTempDataQueryService.queryApiTempData.and.returnValue(of(mockApiTempData));

    // Set up with main search criteria and filters
    component.filterForm.patchValue({
      fromDate: new Date('2024-01-01'),
      toDate: new Date('2024-01-31'),
      idType: 'APITY1',
      sourceId: 'SFA'
    });
    component.appliedFilters = {
      idType: 'APITY1',
      sourceId: 'SFA'
    };
    component.filterChips = [
      { key: 'idType', label: 'ID Type: APITY1 - Type 1', value: 'APITY1' },
      { key: 'sourceId', label: 'Source ID: SFA', value: 'SFA' }
    ];
    component.dataSource = mockApiTempData.data;
    component.showEmptyState = false;
    component.hasRetrievedData = true;

    // Remove one filter (sourceId)
    component.removeFilterChip('sourceId');

    // Should reload data with remaining filters
    expect(apiTempDataQueryService.queryApiTempData).toHaveBeenCalled();
    expect(component.appliedFilters).toBeTruthy();
    expect(component.appliedFilters?.idType).toBe('APITY1');
    expect(component.appliedFilters?.sourceId).toBeUndefined();
  });

  it('should reload data when removing all filter chips', () => {
    apiTempDataQueryService.queryApiTempData.and.returnValue(of(mockApiTempData));

    // Set up with only one filter and main search criteria (requires both dates)
    component.filterForm.patchValue({
      fromDate: new Date('2024-01-01'),
      toDate: new Date('2024-01-31'),
      idType: 'APITY1'
    });
    component.appliedFilters = { idType: 'APITY1' };
    component.filterChips = [
      { key: 'idType', label: 'ID Type: APITY1 - Type 1', value: 'APITY1' }
    ];
    component.dataSource = mockApiTempData.data;
    component.showEmptyState = false;
    component.hasRetrievedData = true;

    // Remove the last filter
    component.removeFilterChip('idType');

    // Should reload data with main search criteria only
    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips).toEqual([]);
    expect(apiTempDataQueryService.queryApiTempData).toHaveBeenCalled();
  });

  it('should reload data when clearing all filters', () => {
    apiTempDataQueryService.queryApiTempData.and.returnValue(of(mockApiTempData));

    // Set up with filters and main search criteria (requires both dates)
    component.filterForm.patchValue({
      fromDate: new Date('2024-01-01'),
      toDate: new Date('2024-01-31'),
      idType: 'APITY1',
      sourceId: 'SFA'
    });
    component.appliedFilters = {
      idType: 'APITY1',
      sourceId: 'SFA'
    };
    component.filterChips = [
      { key: 'idType', label: 'ID Type: APITY1 - Type 1', value: 'APITY1' },
      { key: 'sourceId', label: 'Source ID: SFA', value: 'SFA' }
    ];
    component.hasRetrievedData = true;

    // Clear all filters
    component.clearAllFilters();

    // Should reload data with main search criteria only
    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips).toEqual([]);
    expect(apiTempDataQueryService.queryApiTempData).toHaveBeenCalled();
  });

  it('should display correct symbol for insert date filter chip - after', () => {
    apiTempDataQueryService.queryApiTempData.and.returnValue(of(mockApiTempData));

    const filters = {
      periodType: 'after',
      insertDate: new Date('2024-01-15')
    };
    component.applyFilters(filters);

    const insertDateChip = component.filterChips.find(chip => chip.key === 'insertDate');
    expect(insertDateChip).toBeDefined();
    expect(insertDateChip?.label).toContain('≥');
    expect(insertDateChip?.label).toContain('15-JAN-2024');
  });

  it('should display correct symbol for insert date filter chip - before', () => {
    apiTempDataQueryService.queryApiTempData.and.returnValue(of(mockApiTempData));

    const filters = {
      periodType: 'before',
      insertDate: new Date('2024-01-15')
    };
    component.applyFilters(filters);

    const insertDateChip = component.filterChips.find(chip => chip.key === 'insertDate');
    expect(insertDateChip).toBeDefined();
    expect(insertDateChip?.label).toContain('≤');
    expect(insertDateChip?.label).toContain('15-JAN-2024');
  });

  it('should only show side panel filters as chips, not main form fields', () => {
    apiTempDataQueryService.queryApiTempData.and.returnValue(of(mockApiTempData));

    // Apply filters from filter panel
    const filters = {
      idType: 'APITY1',
      sourceId: 'SFA'
    };
    component.applyFilters(filters);

    // Should only have chips for side panel fields
    expect(component.filterChips.length).toBe(2);
    expect(component.filterChips.some(chip => chip.key === 'idType')).toBe(true);
    expect(component.filterChips.some(chip => chip.key === 'sourceId')).toBe(true);

    // Should NOT have chips for main form fields (temporaryId, permanentId, fromDate, toDate)
    expect(component.filterChips.some(chip => chip.key === 'temporaryId')).toBe(false);
    expect(component.filterChips.some(chip => chip.key === 'permanentId')).toBe(false);
    expect(component.filterChips.some(chip => chip.key === 'fromDate')).toBe(false);
  });

  it('should send sort parameter when querying data with ascending sort', () => {
    apiTempDataQueryService.queryApiTempData.and.returnValue(of(mockApiTempData));

    component.filterForm.patchValue({
      fromDate: new Date('2024-01-01'),
      toDate: new Date('2024-01-31')
    });

    // Set sort direction to ascending
    if (component.tableConfig.sortConfig) {
      component.tableConfig.sortConfig.direction = 'A';
    }

    component.onSearch();

    // Verify the API was called with sort parameter
    const callArgs = apiTempDataQueryService.queryApiTempData.calls.mostRecent().args;
    const filters = callArgs[2]; // third parameter is filters
    expect(filters.SortDirection).toBe('ASC');
  });

  it('should send insertDateAfter when period type is after', () => {
    apiTempDataQueryService.queryApiTempData.and.returnValue(of(mockApiTempData));

    const filters = {
      periodType: 'after',
      insertDate: new Date('2024-01-15')
    };
    component.applyFilters(filters);

    // Verify the API was called with period and insertDate
    const callArgs = apiTempDataQueryService.queryApiTempData.calls.mostRecent().args;
    const requestFilters = callArgs[2]; // third parameter is filters
    expect(requestFilters.period).toBe('after');
    expect(requestFilters.insertDate).toBeDefined();
  });

  it('should send insertDateBefore when period type is before', () => {
    apiTempDataQueryService.queryApiTempData.and.returnValue(of(mockApiTempData));

    const filters = {
      periodType: 'before',
      insertDate: new Date('2024-01-15')
    };
    component.applyFilters(filters);

    // Verify the API was called with period and insertDate
    const callArgs = apiTempDataQueryService.queryApiTempData.calls.mostRecent().args;
    const requestFilters = callArgs[2]; // third parameter is filters
    expect(requestFilters.period).toBe('before');
    expect(requestFilters.insertDate).toBeDefined();
  });

  it('should send fromDate as YYYY-MM-DD local date string without UTC conversion', () => {
    apiTempDataQueryService.queryApiTempData.and.returnValue(of(mockApiTempData));

    // Use local date constructor to create Oct 25 2025 at local midnight
    // (same as what the Material datepicker produces via CustomDateAdapter.parse)
    const fromDate = new Date(2025, 9, 25); // Oct 25 2025, local time midnight
    const toDate = new Date(2025, 10, 25); // Nov 25 2025 - need both dates for validation
    component.filterForm.patchValue({ fromDate, toDate });
    component.onSearch();

    const callArgs = apiTempDataQueryService.queryApiTempData.calls.mostRecent().args;
    const requestFilters = callArgs[2];
    // Must be exactly '2025-10-25' regardless of browser timezone — not '2025-10-24'
    expect(requestFilters.fromDate).toBe('2025-10-25');
  });

  it('should send toDate as YYYY-MM-DD local date string without UTC conversion', () => {
    apiTempDataQueryService.queryApiTempData.and.returnValue(of(mockApiTempData));

    const fromDate = new Date(2026, 1, 1); // Feb 1 2026 - need both dates for validation
    const toDate = new Date(2026, 2, 31); // Mar 31 2026, local time midnight
    component.filterForm.patchValue({ fromDate, toDate });
    component.onSearch();

    const callArgs = apiTempDataQueryService.queryApiTempData.calls.mostRecent().args;
    const requestFilters = callArgs[2];
    expect(requestFilters.toDate).toBe('2026-03-31');
  });

  it('should send insertDateAfter as YYYY-MM-DD local date string without UTC conversion', () => {
    apiTempDataQueryService.queryApiTempData.and.returnValue(of(mockApiTempData));

    const insertDate = new Date(2025, 9, 25); // Oct 25 2025, local time midnight
    component.applyFilters({ periodType: 'after', insertDate });

    const callArgs = apiTempDataQueryService.queryApiTempData.calls.mostRecent().args;
    const requestFilters = callArgs[2];
    expect(requestFilters.period).toBe('after');
    expect(requestFilters.insertDate).toBe('2025-10-25');
  });

  it('should format date using local year/month/day components to preserve calendar date', () => {
    // Directly test the private formatDate method via type assertion
    const component2 = component as any;

    // Simulate a local date (midnight local time) — this is what Material datepicker produces
    const localDate = new Date(2025, 9, 25); // Oct 25, 2025 at 00:00:00 local

    const result = component2.formatDate(localDate);

    // Must produce '2025-10-25' exactly, not shift to the previous day due to UTC conversion
    expect(result).toBe('2025-10-25');
  });

  it('should navigate to donor detail query on donor details click', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    component.onDonorDetails();

    expect(router.navigate).toHaveBeenCalledWith([
      ROUTE_REGISTRY[RouteKey.DonorDetailQuery].path
    ]);
  });

  it('should clear temporary and permanent ID selections and reload filtered dropdowns on ID type change', () => {
    const filteredTempIds = [{ temporaryId: 'TEMP_DN01' }];
    const filteredPermIds = [{ permanentId: 'DN00001234' }];

    apiTempDataQueryService.getTemporaryIds.and.returnValue(of(filteredTempIds));
    apiTempDataQueryService.getPermanentIds.and.returnValue(of(filteredPermIds));

    // Set initial selections
    component.filterForm.patchValue({ temporaryId: 'TEMP001', permanentId: 'PERM001' });

    component.onIdTypeChange('DNRID');

    // Selections should be cleared
    expect(component.filterForm.get('temporaryId')?.value).toBe('');
    expect(component.filterForm.get('permanentId')?.value).toBe('');

    // Service should be called with the ID type filter
    expect(apiTempDataQueryService.getTemporaryIds).toHaveBeenCalledWith('DNRID');
    expect(apiTempDataQueryService.getPermanentIds).toHaveBeenCalledWith('DNRID');

    // Options should be updated
    expect(component.temporaryIdOptions()).toEqual(filteredTempIds);
    expect(component.permanentIdOptions()).toEqual(filteredPermIds);
  });

  it('should clear temp/perm ID dropdowns when ID type is cleared', () => {
    // Simulate having loaded options
    component.temporaryIds = [{ temporaryId: 'TEMP_DN01' }];
    component.permanentIds = [{ permanentId: 'DN00001234' }];
    component.temporaryIdOptions.set(component.temporaryIds);
    component.permanentIdOptions.set(component.permanentIds);

    component.onIdTypeChange('');

    expect(component.temporaryIds).toEqual([]);
    expect(component.permanentIds).toEqual([]);
    expect(component.temporaryIdOptions()).toEqual([]);
    expect(component.permanentIdOptions()).toEqual([]);
  });

});
