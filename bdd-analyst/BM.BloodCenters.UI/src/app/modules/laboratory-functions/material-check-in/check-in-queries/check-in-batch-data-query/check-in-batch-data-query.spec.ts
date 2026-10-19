import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { CheckInBatchDataQueryComponent } from './check-in-batch-data-query';
import { CheckInBatchDataQueryApiService } from './services/check-in-batch-data-query-api.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockTranslateService, createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';

describe('CheckInBatchDataQueryComponent', () => {
  let component: CheckInBatchDataQueryComponent;
  let fixture: ComponentFixture<CheckInBatchDataQueryComponent>;
  let mockApiService: jasmine.SpyObj<CheckInBatchDataQueryApiService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let chapterChanged$: Subject<unknown>;

  const mockItems = [
    {
      batchId: '111619-CB9006',
      contractId: 'INTERNAL',
      company: 'Test Hospital',
      minTemp: 20,
      maxTemp: 25,
      productType: 'FFP',
      cartonCount: 1,
      numberOfUnits: 5,
      shippedDate: '10-Dec-2025',
      receivedDate: '10-Dec-2025',
      qcDate: '10-Dec-2025 14.30',
      batchDate: '11-Jan-2025 10.15',
      checkinUserId: 'TESTUSER',
      userName: 'Test User',
    },
    {
      batchId: '111619-CB9007',
      contractId: 'EXTERNAL',
      company: 'Test Lab',
      minTemp: 18,
      maxTemp: 22,
      productType: 'RBC',
      cartonCount: 2,
      numberOfUnits: 10,
      shippedDate: '11-Dec-2025',
      receivedDate: '11-Dec-2025',
      qcDate: '11-Dec-2025 10.00',
      batchDate: '12-Jan-2025 09.00',
      checkinUserId: 'USER2',
      userName: 'Another User',
    },
  ];

  beforeEach(() => {

    chapterChanged$ = new Subject();

    mockApiService = jasmine.createSpyObj('CheckInBatchDataQueryApiService', [
      'getCheckInBatchData',
      'getProductTypes',
      'getCheckinUsers',
    ]);
    mockHeaderService = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });
    mockPageHeaderService = {
      pageHeaderData: signal({ title: 'Check-In Batch Data Query', subtitle: 'View batch data' }),
      getCurrentMenuItem: jasmine.createSpy('getCurrentMenuItem').and.returnValue(undefined),
      getTitle: jasmine.createSpy('getTitle').and.returnValue(''),
      getSubtitle: jasmine.createSpy('getSubtitle').and.returnValue(''),
    } as any;
    mockTranslateService = createMockTranslateService();
    mockSnackbarService = createMockSnackbarService();

    mockApiService.getCheckInBatchData.and.returnValue(
      of({ data: mockItems, total: 2 }),
    );
    mockApiService.getProductTypes.and.returnValue(of([
      { productType: 'FFP', productDesc: 'Fresh Frozen Plasma' },
      { productType: 'RBC', productDesc: 'Red Blood Cells' },
    ]));
    mockApiService.getCheckinUsers.and.returnValue(of([]));



      TestBed.configureTestingModule({
      imports: [CheckInBatchDataQueryComponent, NoopAnimationsModule],
      providers: [
        { provide: CheckInBatchDataQueryApiService, useValue: mockApiService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({}),
          },
        },
      ],
    });


      mockApiService.getCheckinUsers.and.returnValue(of([]));



    
    fixture = TestBed.createComponent(CheckInBatchDataQueryComponent);
    component = fixture.componentInstance;
  });






  it('should load product types from API and users from grid data', () => {
    fixture.detectChanges();

    expect(mockApiService.getProductTypes).toHaveBeenCalled();
    expect(component.productTypeOptions.length).toBe(2);
    expect(component.productTypeOptions.map(o => o.code)).toContain('FFP');
    expect(component.productTypeOptions.map(o => o.code)).toContain('RBC');
    expect(component.productTypeOptions[0].description).toContain('Fresh Frozen Plasma');
    expect(component.checkInUserOptions.length).toBe(2);
    expect(component.checkInUserOptions.map(o => o.userId)).toContain('TESTUSER');
    expect(component.checkInUserOptions.map(o => o.userId)).toContain('USER2');
  });

  it('should search when search keyword is entered', () => {
    const searchKeyword = '111619';
    spyOn(component, 'loadData');

    component.onSearch(searchKeyword);

    expect(component.searchKeyword).toBe(searchKeyword);
    expect(component.loadData).toHaveBeenCalled();
  });



  it('should trim search keyword', () => {
    spyOn(component, 'loadData');

    component.onSearch('  111619  ');

    expect(component.searchKeyword).toBe('111619');
  });



  it('should apply filters and reload data via API', () => {
    spyOn(component, 'loadData');

    component.applyFilters({ productType: 'FFP' });

    expect(component.appliedFilters).toEqual({ productType: 'FFP' });
    expect(component.loadData).toHaveBeenCalled();
  });





  it('should handle page change via API', () => {
    spyOn(component, 'loadData');

    component.onPageChange({ pageIndex: 1, pageSize: 25, previousPageIndex: 0 });

    expect(component.tableConfig.pagination?.pageIndex).toBe(1);
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should handle page size change via API', () => {
    spyOn(component, 'loadData');

    component.onPageChange({ pageIndex: 0, pageSize: 50, previousPageIndex: 0 });

    expect(component.tableConfig.pagination?.pageSize).toBe(50);
  });



  it('should reset filters and reload on chapter change', () => {
    fixture.detectChanges();
    component.appliedFilters = { productType: 'RBC' };
    component.searchKeyword = 'test';
    component.hasSearched = true;

    chapterChanged$.next({});

    expect(component.appliedFilters).toBeNull();
    expect(component.searchKeyword).toBe('');
    expect(component.filterChips.length).toBe(0);
    expect(mockApiService.getCheckInBatchData).toHaveBeenCalled();
  });







  it('should open filter panel', () => {
    fixture.detectChanges();
    expect(component.isFilterOpen).toBe(false);

    component.openFilterPanel();

    expect(component.isFilterOpen).toBe(true);
    expect(component.filterOverlayRef).not.toBeNull();
  });





  it('should report filter active when filters are applied', () => {
    component.appliedFilters = { productType: 'RBC' };
    expect(component.isFilterActive).toBe(true);
  });

  it('should report filter active when panel is open', () => {
    component.isFilterOpen = true;
    expect(component.isFilterActive).toBe(true);
  });



  it('should set hasSearched to true when loadData is called', () => {
    fixture.detectChanges();

    expect(component.hasSearched).toBe(true);
  });









  it('should pass search keyword as batchId in request body', () => {
    fixture.detectChanges();
    component.searchKeyword = '123119';
    component.loadData();

    const callArgs = mockApiService.getCheckInBatchData.calls.mostRecent().args;
    expect(callArgs[2]?.batchId).toBe('123119');
  });

  it('should filter by checkinUserId via API', () => {
    spyOn(component, 'loadData');

    component.applyFilters({ checkInUserId: 'USER2' });

    expect(component.appliedFilters).toEqual({ checkInUserId: 'USER2' });
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should handle sort change', () => {
    spyOn(component, 'loadData');
    component.onSortChange({ column: 'batchId', direction: 'D' });

    expect(component.tableConfig.sortConfig?.column).toBe('batchId');
    expect(component.tableConfig.sortConfig?.direction).toBe('D');
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should handle loadData API error', () => {
    mockApiService.getCheckInBatchData.and.returnValue(
      throwError(() => new Error('API Error'))
    );
    fixture.detectChanges();

    component.loadData();

    expect(component.dataSource).toEqual([]);
    expect(component.isLoading).toBeFalse();
    expect(mockSnackbarService.showError).toHaveBeenCalled();
  });

  it('should handle loadDropdownOptions error gracefully', () => {
    mockApiService.getProductTypes.and.returnValue(
      throwError(() => new Error('fail'))
    );
    fixture.detectChanges();

    // Chapter change triggers loadDropdownOptions
    chapterChanged$.next({});

    expect(component.productTypeOptions).toEqual([]);
  });

  it('should close filter panel and reset state', () => {
    fixture.detectChanges();
    component.openFilterPanel();
    expect(component.isFilterOpen).toBeTrue();

    component.closeFilterPanel();
    expect(component.isFilterOpen).toBeFalse();
    expect(component.filterOverlayRef).toBeNull();
  });

  it('should handle onRemoveFilterChip', () => {
    spyOn(component, 'loadData');
    component.appliedFilters = { productType: 'FFP' };
    component.onRemoveFilterChip('productType');

    expect(component.loadData).toHaveBeenCalled();
  });

  it('should handle onClearAllFilters', () => {
    spyOn(component, 'loadData');
    component.appliedFilters = { productType: 'FFP' };
    component.onClearAllFilters();

    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips).toEqual([]);
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should handle keyboard shortcut Alt+F to open filter', () => {
    fixture.detectChanges();
    const event = new KeyboardEvent('keydown', { altKey: true, key: 'f' });
    spyOn(event, 'preventDefault');

    component.handleKeyboardEvent(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should handle Escape key to close filter', () => {
    fixture.detectChanges();
    component.isFilterOpen = true;

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    component.handleKeyboardEvent(event);

    expect(component.isFilterOpen).toBeFalse();
  });

  it('should include sort params in request when sort is active', () => {
    fixture.detectChanges();
    component.tableConfig.sortConfig = { column: 'batchId', direction: 'A' };
    component.loadData();

    const callArgs = mockApiService.getCheckInBatchData.calls.mostRecent().args;
    expect(callArgs[2]?.sortColumn).toBe('batchId');
    expect(callArgs[2]?.sortOrder).toBe('ASC');
  });

  it('should include filter params in loadData request', () => {
    fixture.detectChanges();
    component.appliedFilters = { productType: 'FFP', checkInUserId: 'USER1' };
    component.loadData();

    const callArgs = mockApiService.getCheckInBatchData.calls.mostRecent().args;
    expect(callArgs[2]?.productType).toBe('FFP');
    expect(callArgs[2]?.checkinUserId).toBe('USER1');
  });

  it('should clean up on destroy', () => {
    fixture.detectChanges();
    const destroyNext = spyOn(component['destroy$'], 'next');
    const destroyComplete = spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(destroyNext).toHaveBeenCalled();
    expect(destroyComplete).toHaveBeenCalled();
  });

  it('should toggle filter panel closed when already open', () => {
    fixture.detectChanges();
    component.openFilterPanel();
    expect(component.filterOverlayRef).not.toBeNull();

    component.openFilterPanel();
    expect(component.filterOverlayRef).toBeNull();
  });

  it('should handle onSearch with empty string', () => {
    spyOn(component, 'loadData');
    component.onSearch('');

    expect(component.searchKeyword).toBe('');
    expect(component.loadData).toHaveBeenCalled();
  });
});
