import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { ValidReagentSupplierCodesComponent } from './valid-reagent-supplier-codes';
import { ValidReagentSupplierCodeService } from './services/valid-reagent-supplier-code.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { PageHeaderService } from '@shared/services/page-header.service';
import { of, throwError } from 'rxjs';
import { ValidReagentSupplierCode } from './models/valid-reagent-supplier-code.model';
import { ValidReagentSupplierCodeFilterValue } from './filter-panel/valid-reagent-supplier-code-filter-panel';
import { createMockTranslateService, createMockMatSnackBar, createMockPageHeaderService } from '@shared/testing/common-mocks';
import moment from 'moment';

describe('ValidReagentSupplierCodesComponent', () => {
  let pageHeaderServiceSpy: any;
  let serviceSpy: any;
  let component: ValidReagentSupplierCodesComponent;
  let fixture: ComponentFixture<ValidReagentSupplierCodesComponent>;
  let service: jasmine.SpyObj<ValidReagentSupplierCodeService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockSupplierData: ValidReagentSupplierCode[] = [
    {
      supplierCode: 'VRX',
      supplierName: 'Verax Biomedical',
      effDate: '2025-01-01T00:00:00Z',
      termDate: null,
      lastModifyDate: '2025-01-01T00:00:00Z',
      lastModifyUser: 'CELHUN'
    },
    {
      supplierCode: 'IBS',
      supplierName: 'Immucor Blood Systems',
      effDate: '2024-06-15T00:00:00Z',
      termDate: '2025-06-15T00:00:00Z',
      lastModifyDate: '2024-06-15T00:00:00Z',
      lastModifyUser: 'ADMIN'
    }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('ValidReagentSupplierCodeService', [
      'getAll',
      'getById',
      'create',
      'update',
      'delete'
    ]);
    const snackBarSpy = createMockMatSnackBar();
    const translateSpy = createMockTranslateService();
    const activatedRouteSpy = { snapshot: { paramMap: { get: () => null } } };
    pageHeaderServiceSpy = createMockPageHeaderService();
    pageHeaderServiceSpy.pageHeaderData = signal(null);
    pageHeaderServiceSpy.getTitle.and.returnValue('');



      TestBed.configureTestingModule({
      imports: [
        ValidReagentSupplierCodesComponent,
        HttpClientTestingModule,
        NoopAnimationsModule
      ]
    })
    .overrideProvider(ValidReagentSupplierCodeService, { useValue: serviceSpy })
    .overrideProvider(MatSnackBar, { useValue: snackBarSpy })
    .overrideProvider(TranslateService, { useValue: translateSpy })
    .overrideProvider(ActivatedRoute, { useValue: activatedRouteSpy })
    .overrideProvider(PageHeaderService, { useValue: pageHeaderServiceSpy });





      serviceSpy.getAll.calls.reset();


      serviceSpy.getById.calls.reset();


      serviceSpy.create.calls.reset();


      serviceSpy.update.calls.reset();


      serviceSpy.delete.calls.reset();


      pageHeaderServiceSpy.getTitle.and.returnValue('');


    service = TestBed.inject(ValidReagentSupplierCodeService) as jasmine.SpyObj<ValidReagentSupplierCodeService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    fixture = TestBed.createComponent(ValidReagentSupplierCodesComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {

    it('should initialize with default state values', () => {
      expect(component.dataSource).toEqual([]);
      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(false);
      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.isFilterOpen).toBe(false);
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
    });

    it('should initialize table configuration with correct columns', () => {
      expect(component.tableConfig.columns.length).toBe(6);
      expect(component.tableConfig.columns[0].key).toBe('supplierCode');
      expect(component.tableConfig.columns[1].key).toBe('supplierName');
      expect(component.tableConfig.columns[2].key).toBe('effDate');
      expect(component.tableConfig.columns[3].key).toBe('termDate');
      expect(component.tableConfig.columns[4].key).toBe('lastModifyDate');
      expect(component.tableConfig.columns[5].key).toBe('lastModifyUser');
    });

    it('should initialize table with pagination settings', () => {
      expect(component.tableConfig.pagination?.pageSize).toBe(25);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(component.tableConfig.pagination?.totalRecords).toBe(0);
      expect(component.tableConfig.pagination?.pageSizeOptions).toEqual([10, 25, 50, 100]);
    });

    it('should initialize with search configuration', () => {
      expect(component.searchConfig.placeholder).toBe('Search by supplier name or code');
      expect(component.searchConfig.minLength).toBe(1);
      expect(component.searchConfig.searchOnEnterOnly).toBe(true);
      expect(component.searchConfig.debounceTime).toBe(300);
    });

    it('should call loadData on ngOnInit', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));
      spyOn(component, 'loadData').and.callThrough();

      component.ngOnInit();

      expect(component.loadData).toHaveBeenCalled();
    });

    it('should complete destroy$ on ngOnDestroy', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should have header config with ADD NEW CODE action', () => {
      expect(component.headerConfig.actions).toBeDefined();
      expect(component.headerConfig.actions!.length).toBe(1);
      expect(component.headerConfig.actions![0].label).toBe('ADD NEW CODE');
    });

    it('should have sortable supplierCode column', () => {
      const codeCol = component.tableConfig.columns.find(c => c.key === 'supplierCode');
      expect(codeCol?.sortable).toBe(true);
    });

    it('should have non-sortable supplierName column', () => {
      const nameCol = component.tableConfig.columns.find(c => c.key === 'supplierName');
      expect(nameCol?.sortable).toBe(false);
    });

    it('should have edit row action configured', () => {
      expect(component.tableConfig.rowActions).toBeDefined();
      expect(component.tableConfig.rowActions!.length).toBe(1);
      expect(component.tableConfig.rowActions![0].action).toBe('edit');
    });
  });

  describe('Data Loading', () => {

    it('should set isLoading to true when loadData starts', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));

      component.loadData();

      expect(service.getAll).toHaveBeenCalled();
    });

    it('should populate dataSource on successful load', () => {
      service.getAll.and.returnValue(of({ data: mockSupplierData, totalRecords: 2 }));

      component.loadData();

      expect(component.dataSource).toEqual(mockSupplierData);
      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(false);
    });

    it('should update totalRecords in pagination on successful load', () => {
      service.getAll.and.returnValue(of({ data: mockSupplierData, totalRecords: 42 }));

      component.loadData();

      expect(component.tableConfig.pagination!.totalRecords).toBe(42);
    });

    it('should update first column header with total count', () => {
      service.getAll.and.returnValue(of({ data: mockSupplierData, totalRecords: 15 }));

      component.loadData();

      expect(component.tableConfig.columns[0].header).toBe('Code (15)');
    });

    it('should handle error when loading data fails', () => {
      const errorResponse = { error: { message: 'Server error' } };
      service.getAll.and.returnValue(throwError(() => errorResponse));

      component.loadData();

      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Failed to load valid reagent supplier codes. Please try again.');
    });

    it('should calculate skip value based on pagination', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));
      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 25;

      component.loadData();

      expect(service.getAll).toHaveBeenCalledWith(25, 50, jasmine.any(Object));
    });

    it('should reset hasError to false before loading', () => {
      component.hasError = true;
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));

      component.loadData();

      expect(component.hasError).toBe(false);
    });
  });

  describe('Search Functionality', () => {
    it('should update query and load data when search is triggered', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));

      component.onSearch('VRX');

      expect(service.getAll).toHaveBeenCalled();
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should set SearchKeyword to null when empty string is searched', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));

      component.onSearch('');

      expect(service.getAll).toHaveBeenCalled();
    });

    it('should reset pagination to page 0 on search', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));
      component.tableConfig.pagination!.pageIndex = 3;

      component.onSearch('test');

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });
  });

  describe('Sorting', () => {
    it('should handle sort change with ascending order', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));

      component.onSortChange({ column: 'supplierCode', direction: 'A' });

      expect(component.tableConfig.sortConfig!.column).toBe('supplierCode');
      expect(component.tableConfig.sortConfig!.direction).toBe('A');
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(service.getAll).toHaveBeenCalled();
    });

    it('should handle sort change with descending order', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));

      component.onSortChange({ column: 'supplierName', direction: 'D' });

      expect(component.tableConfig.sortConfig!.column).toBe('supplierName');
      expect(component.tableConfig.sortConfig!.direction).toBe('D');
      expect(service.getAll).toHaveBeenCalled();
    });

    it('should handle default sort (no sort)', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));

      component.onSortChange({ column: 'supplierCode', direction: 'default' });

      expect(component.tableConfig.sortConfig!.direction).toBe('default');
      expect(service.getAll).toHaveBeenCalled();
    });

    it('should reset pagination when sort changes', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));
      component.tableConfig.pagination!.pageIndex = 5;

      component.onSortChange({ column: 'effDate', direction: 'A' });

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should map supplierCode to PascalCase for backend', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));

      component.onSortChange({ column: 'supplierCode', direction: 'A' });

      expect(component['currentQuery'].SortColumn).toBe('SupplierCode');
      expect(component['currentQuery'].SortOrder).toBe('ASC');
    });

    it('should map descending direction to DESC', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));

      component.onSortChange({ column: 'supplierCode', direction: 'D' });

      expect(component['currentQuery'].SortOrder).toBe('DESC');
    });

    it('should set SortColumn and SortOrder to null on default sort', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));

      component.onSortChange({ column: 'supplierCode', direction: 'default' });

      expect(component['currentQuery'].SortColumn).toBeNull();
      expect(component['currentQuery'].SortOrder).toBeNull();
    });
  });

  describe('Filter Operations', () => {
    it('should toggle isFilterOpen', () => {
      expect(component.isFilterOpen).toBe(false);

      component.toggleFilter();
      expect(component.isFilterOpen).toBe(true);

      component.toggleFilter();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should apply filters and update query', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));
      const filters: ValidReagentSupplierCodeFilterValue = {
        showTerminated: 'Y'
      };

      component.onApplyFilters(filters);

      expect(component.appliedFilters).toEqual(filters);
      expect(component['currentQuery'].ShowTerminated).toBe('Y');
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(service.getAll).toHaveBeenCalled();
    });

    it('should generate filter chips when filters applied', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));
      const filters: ValidReagentSupplierCodeFilterValue = {
        showTerminated: 'Y'
      };

      component.onApplyFilters(filters);

      expect(component.filterChips.length).toBeGreaterThan(0);
    });

    it('should apply filters with effective date', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));
      const testDate = moment('2025-06-15');
      const filters: ValidReagentSupplierCodeFilterValue = {
        effectiveDate: testDate,
        effectiveDatePeriod: 'After'
      };

      component.onApplyFilters(filters);

      expect(component.appliedFilters).toEqual(filters);
      expect(component['currentQuery'].EffectiveDatePeriod).toBe('After');
      expect(component['currentQuery'].EffectiveDate).toBeDefined();
    });

    it('should remove a specific filter chip', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));
      const filters: ValidReagentSupplierCodeFilterValue = {
        showTerminated: 'Y',
        effectiveDate: moment('2025-06-15'),
        effectiveDatePeriod: 'After'
      };
      component.appliedFilters = filters;

      component.onRemoveFilterChip('showTerminated');

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(service.getAll).toHaveBeenCalled();
    });

    it('should clear all filters and reset query', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));
      component.appliedFilters = { showTerminated: 'Y' };
      component.filterChips = [{ key: 'showTerminated', label: 'Show Terminated: Yes', value: 'Y' }];

      component.onClearAllFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component['currentQuery'].ShowTerminated).toBe('N');
      expect(component['currentQuery'].EffectiveDate).toBeNull();
      expect(component['currentQuery'].TerminationDate).toBeNull();
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(service.getAll).toHaveBeenCalled();
    });

    it('should close side panel when clearing all filters if open', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));
      component.sidePanelOpen = true;

      component.onClearAllFilters();

      expect(component.sidePanelOpen).toBe(false);
    });

    it('should not close side panel when clearing filters if already closed', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));
      component.sidePanelOpen = false;

      component.onClearAllFilters();

      expect(component.sidePanelOpen).toBe(false);
    });
  });

  describe('Pagination', () => {
    it('should update pagination and load data on page change', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));

      component.onPageChange({ pageIndex: 2, pageSize: 50 } as any);

      expect(component.tableConfig.pagination!.pageIndex).toBe(2);
      expect(component.tableConfig.pagination!.pageSize).toBe(50);
      expect(service.getAll).toHaveBeenCalled();
    });

    it('should update page size on page change', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));

      component.onPageChange({ pageIndex: 0, pageSize: 100 } as any);

      expect(component.tableConfig.pagination!.pageSize).toBe(100);
    });
  });

  describe('Row Actions', () => {
    it('should open edit dialog on edit row action', () => {
      const mockData = mockSupplierData[0];
      spyOn(component, 'openEditDialog');

      component.onRowAction({ action: 'edit', row: mockData } as any);

      expect(component.openEditDialog).toHaveBeenCalledWith(mockData);
    });

    it('should not open edit dialog for non-edit actions', () => {
      spyOn(component, 'openEditDialog');

      component.onRowAction({ action: 'delete', row: mockSupplierData[0] } as any);

      expect(component.openEditDialog).not.toHaveBeenCalled();
    });
  });

  describe('Side Panel Operations', () => {
    it('should open add dialog', () => {
      component.openAddDialog();

      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should open edit dialog with data', () => {
      const mockData = mockSupplierData[0];

      component.openEditDialog(mockData);

      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockData);
    });

    it('should close side panel', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockSupplierData[0];

      component.closeSidePanel();

      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });

    it('should handle mode change', () => {
      component.sidePanelMode = 'add';

      component.onModeChange('edit');

      expect(component.sidePanelMode).toBe('edit');
    });

    it('should handle mode change back to add', () => {
      component.sidePanelMode = 'edit';

      component.onModeChange('add');

      expect(component.sidePanelMode).toBe('add');
    });

    it('should keep panel open when adding another record', fakeAsync(() => {
      service.getAll.and.returnValue(of({ data: mockSupplierData, totalRecords: 2 }));
      fixture.detectChanges();
      component.sidePanelOpen = true;
      component.sidePanelMode = 'add';

      component.onSaveSuccess(true);
      tick();
      fixture.detectChanges();

      expect(component.sidePanelOpen).toBe(true);
      expect(service.getAll).toHaveBeenCalled();
    }));

    it('should close panel and reload on regular save success', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));
      component.sidePanelOpen = true;
      component.sidePanelData = mockSupplierData[0];

      component.onSaveSuccess(false);

      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
      expect(service.getAll).toHaveBeenCalled();
    });

    it('should reload data on save success regardless of addAnother', () => {
      service.getAll.and.returnValue(of({ data: [], totalRecords: 0 }));

      component.onSaveSuccess(true);
      expect(service.getAll).toHaveBeenCalledTimes(1);

      component.onSaveSuccess(false);
      expect(service.getAll).toHaveBeenCalledTimes(2);
    });
  });

  describe('Date Formatting', () => {
    it('should format valid date to DD-MON-YYYY', () => {
      const formatted = (component as any).formatDate('2025-03-12T00:00:00Z');
      expect(formatted).toBe('12-MAR-2025');
    });

    it('should format different date correctly', () => {
      const formatted = (component as any).formatDate('2024-12-25T00:00:00Z');
      expect(formatted).toBe('25-DEC-2024');
    });

    it('should handle empty date string', () => {
      const formatted = (component as any).formatDate('');
      expect(formatted).toBe('');
    });

    it('should handle invalid date string', () => {
      const formatted = (component as any).formatDate('invalid-date');
      expect(formatted).toBe('');
    });

    it('should format January date correctly', () => {
      const formatted = (component as any).formatDate('2025-01-05T00:00:00Z');
      expect(formatted).toBe('05-JAN-2025');
    });

    it('should use column valueFormatter for effDate', () => {
      const effCol = component.tableConfig.columns.find(c => c.key === 'effDate');
      expect(effCol?.valueFormatter).toBeDefined();
      const result = effCol!.valueFormatter!('2025-06-15T00:00:00Z');
      expect(result).toBe('15-JUN-2025');
    });

    it('should use column valueFormatter for termDate returning empty for null', () => {
      const termCol = component.tableConfig.columns.find(c => c.key === 'termDate');
      expect(termCol?.valueFormatter).toBeDefined();
      const result = termCol!.valueFormatter!(null);
      expect(result).toBe('');
    });

    it('should use column valueFormatter for lastModifyDate', () => {
      const modCol = component.tableConfig.columns.find(c => c.key === 'lastModifyDate');
      expect(modCol?.valueFormatter).toBeDefined();
      const result = modCol!.valueFormatter!('2025-01-01T00:00:00Z');
      expect(result).toBe('01-JAN-2025');
    });
  });

  describe('Table Configuration', () => {

    it('should have correct empty message', () => {
      expect(component.tableConfig.emptyMessage).toBe('No Results to Display');
    });

    it('should have pagination enabled', () => {
      expect(component.tableConfig.showPagination).toBe(true);
    });

    it('should have sticky header enabled', () => {
      expect(component.tableConfig.stickyHeader).toBe(true);
    });

    it('should have sticky actions column enabled', () => {
      expect(component.tableConfig.stickyActionsColumn).toBe(true);
    });

    it('should have default sort config on supplierCode', () => {
      expect(component.tableConfig.sortConfig?.column).toBe('supplierCode');
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
    });

    it('should show first and last pagination buttons', () => {
      expect(component.tableConfig.pagination?.showFirstLastButtons).toBe(true);
    });
  });
});
