import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ElementRef } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { of, throwError, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { BarCodeComponent } from './bar-code';
import { BarCodeService } from './services/bar-code.service';
import { HeaderService } from '@shared/services/header.service';
import { BarCodeModel, BarCodeFilterValue } from './models/bar-code.model';
import { LabelingFilterDataService } from '../services/labeling-filter-data.service';
import { provideRouter } from '@angular/router';

describe('BarCodeComponent', () => {
  let component: BarCodeComponent;
  let fixture: ComponentFixture<BarCodeComponent>;
  let mockBarCodeService: jasmine.SpyObj<BarCodeService>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let chapterChangedSubject: Subject<void>;
  let filterDataService: LabelingFilterDataService;

  // Overlay ref mock for manual overlayRef assignment in tests
  let mockOverlayRef: jasmine.SpyObj<any>;

  const mockBarCodeData: BarCodeModel[] = [
    {
      barcodeValue: 'BC001',
      barcodeDesc: 'Barcode 001',
      testId: 'T001',
      resultCode: 'N',
      effDate: '2024-01-01',
      termDate: null
    },
    {
      barcodeValue: 'BC002',
      barcodeDesc: 'Barcode 002',
      testId: 'T002',
      resultCode: 'P',
      effDate: '2024-01-15',
      termDate: '2025-12-31'
    }
  ];

  beforeEach(() => {
    mockBarCodeService = jasmine.createSpyObj('BarCodeService', [
      'getBarCodes',
      'getBarcodeLookups',
      'getTestIdLookups',
      'createBarCode',
      'updateBarCode'
    ]);

    chapterChangedSubject = new Subject<void>();

    // Overlay ref mock (used for manually setting component['overlayRef'] in tests)
    mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['attach', 'dispose', 'backdropClick']);

    // Note: The Overlay mock below is provided to TestBed but the component
    // receives the real Overlay via its standalone imports (CDK OverlayModule).
    // The mockOverlayRef is used directly via component['overlayRef'] assignment.
    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position']);

    TestBed.configureTestingModule({
      imports: [BarCodeComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BarCodeService, useValue: mockBarCodeService },
        { provide: Overlay, useValue: mockOverlay },
        { provide: HeaderService, useValue: { chapterChanged$: chapterChangedSubject.asObservable() } },
        LabelingFilterDataService
      ]
    });

    fixture = TestBed.createComponent(BarCodeComponent);
    component = fixture.componentInstance;
    filterDataService = TestBed.inject(LabelingFilterDataService);
  });

  it('should create the component', () => {
    mockBarCodeService.getBarCodes.and.returnValue(of({ data: [], totalRecords: 0 }));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    beforeEach(() => {
      mockBarCodeService.getBarCodes.and.returnValue(of({ data: mockBarCodeData, totalRecords: 2 }));
      fixture.detectChanges();
    });

    it('should initialize search config with correct values', () => {
      expect(component.searchConfig.placeholder).toBe('Search by Bar Code or Description');
      expect(component.searchConfig.minLength).toBe(3);
      expect(component.searchConfig.ariaLabel).toBe('Search barcode configurations');
    });

    it('should initialize table config with correct columns', () => {
      expect(component.tableConfig.columns.length).toBe(6);
      expect(component.tableConfig.columns[0].key).toBe('barcodeValue');
      expect(component.tableConfig.columns[1].key).toBe('barcodeDesc');
      expect(component.tableConfig.columns[2].key).toBe('testId');
      expect(component.tableConfig.columns[3].key).toBe('resultCode');
      expect(component.tableConfig.columns[4].key).toBe('effDate');
      expect(component.tableConfig.columns[5].key).toBe('termDate');
    });

    it('should initialize table config with sort config', () => {
      expect(component.tableConfig.sortConfig!.column).toBe('barcodeValue');
    });

    it('should initialize table config with row actions', () => {
      expect(component.tableConfig.rowActions!.length).toBe(1);
      expect(component.tableConfig.rowActions![0].action).toBe('edit');
    });

    it('should initialize table config with sticky settings and messages', () => {
      expect(component.tableConfig.stickyHeader).toBe(true);
      expect(component.tableConfig.stickyActionsColumn).toBe(true);
      expect(component.tableConfig.emptyMessage).toBe('No barcode configurations to view');
      expect(component.tableConfig.loadingMessage).toBe('Loading barcode configuration data...');
      expect(component.tableConfig.showPagination).toBe(false);
    });

    it('should have barcodeDesc column valueFormatter return value or dash', () => {
      const descColumn = component.tableConfig.columns.find(c => c.key === 'barcodeDesc');
      expect(descColumn!.valueFormatter!('Some desc', {} as any)).toBe('Some desc');
      expect(descColumn!.valueFormatter!(null as any, {} as any)).toBe('-');
      expect(descColumn!.valueFormatter!('' as any, {} as any)).toBe('-');
    });

    it('should have resultCode column valueFormatter use formatResultCode', () => {
      const resultColumn = component.tableConfig.columns.find(c => c.key === 'resultCode');
      expect(resultColumn!.valueFormatter!('N' as any, {} as any)).toBe('Negative');
      expect(resultColumn!.valueFormatter!('P' as any, {} as any)).toBe('Positive');
      expect(resultColumn!.valueFormatter!(null as any, {} as any)).toBe('-');
    });

    it('should have effDate column valueFormatter use formatDate', () => {
      const effDateColumn = component.tableConfig.columns.find(c => c.key === 'effDate');
      expect(effDateColumn!.valueFormatter!('2024-01-01' as any, {} as any)).toBe('01-JAN-2024');
      expect(effDateColumn!.valueFormatter!(null as any, {} as any)).toBe('-');
    });

    it('should have termDate column valueFormatter use formatDate', () => {
      const termDateColumn = component.tableConfig.columns.find(c => c.key === 'termDate');
      expect(termDateColumn!.valueFormatter!('2025-12-31' as any, {} as any)).toBe('31-DEC-2025');
      expect(termDateColumn!.valueFormatter!(null as any, {} as any)).toBe('-');
    });
  });

  describe('loadData', () => {
    it('should set isLoading true and hasError false when loading starts', () => {
      const subject = new Subject<{ data: BarCodeModel[]; totalRecords: number }>();
      mockBarCodeService.getBarCodes.and.returnValue(subject);
      fixture.detectChanges();

      expect(component.isLoading).toBe(true);
      expect(component.hasError).toBe(false);
    });

    it('should set dataSource and isLoading false on success', () => {
      mockBarCodeService.getBarCodes.and.returnValue(
        of({ data: mockBarCodeData, totalRecords: 2 })
      );
      fixture.detectChanges();

      expect(component.dataSource).toEqual(mockBarCodeData);
      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(false);
    });

    it('should populate filterDataService when cache is empty', () => {
      spyOn(filterDataService, 'getData').and.returnValue([]);
      spyOn(filterDataService, 'setData');

      mockBarCodeService.getBarCodes.and.returnValue(
        of({ data: mockBarCodeData, totalRecords: 2 })
      );
      fixture.detectChanges();

      expect(filterDataService.setData).toHaveBeenCalledWith('bar-code', mockBarCodeData);
    });

    it('should not populate filterDataService when cache already has data', () => {
      spyOn(filterDataService, 'getData').and.returnValue([{ barcodeValue: 'existing' }]);
      spyOn(filterDataService, 'setData');

      mockBarCodeService.getBarCodes.and.returnValue(
        of({ data: mockBarCodeData, totalRecords: 2 })
      );
      fixture.detectChanges();

      expect(filterDataService.setData).not.toHaveBeenCalled();
    });

    it('should set error state on failure', () => {
      mockBarCodeService.getBarCodes.and.returnValue(
        throwError(() => new Error('Server error'))
      );
      fixture.detectChanges();

      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Failed to load barcode configuration data. Please try again.');
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      mockBarCodeService.getBarCodes.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
    });

    it('should clear search and reload when search text is empty', () => {
      component.onSearchEvent('');

      expect(component.requestState.searchKeyword).toBeUndefined();
      expect(mockBarCodeService.getBarCodes).toHaveBeenCalled();
    });

    it('should clear search and reload when search text is whitespace only', () => {
      mockBarCodeService.getBarCodes.calls.reset();
      component.onSearchEvent('   ');

      expect(component.requestState.searchKeyword).toBeUndefined();
      expect(mockBarCodeService.getBarCodes).toHaveBeenCalled();
    });

    it('should not reload when search text is non-empty', () => {
      mockBarCodeService.getBarCodes.calls.reset();
      component.onSearchEvent('abc');

      expect(mockBarCodeService.getBarCodes).not.toHaveBeenCalled();
    });

    it('should set searchKeyword and reload on enter search with >= 3 chars', () => {
      component.searchBarComponent = { searchText: 'test', clearSearch: jasmine.createSpy(), focus: jasmine.createSpy() } as any;
      mockBarCodeService.getBarCodes.calls.reset();

      component.onEnterSearch();

      expect(component.requestState.searchKeyword).toBe('test');
      expect(mockBarCodeService.getBarCodes).toHaveBeenCalled();
    });

    it('should not trigger search on enter with < 3 chars', () => {
      component.searchBarComponent = { searchText: 'ab', clearSearch: jasmine.createSpy(), focus: jasmine.createSpy() } as any;
      mockBarCodeService.getBarCodes.calls.reset();

      component.onEnterSearch();

      expect(mockBarCodeService.getBarCodes).not.toHaveBeenCalled();
    });

    it('should handle enter search when searchBarComponent has empty text', () => {
      component.searchBarComponent = { searchText: '', clearSearch: jasmine.createSpy(), focus: jasmine.createSpy() } as any;
      mockBarCodeService.getBarCodes.calls.reset();

      component.onEnterSearch();

      expect(mockBarCodeService.getBarCodes).not.toHaveBeenCalled();
    });

    it('should handle enter search when searchBarComponent is undefined', () => {
      component.searchBarComponent = undefined as any;
      mockBarCodeService.getBarCodes.calls.reset();

      component.onEnterSearch();

      expect(mockBarCodeService.getBarCodes).not.toHaveBeenCalled();
    });

    it('should trim whitespace from search text on enter search', () => {
      component.searchBarComponent = { searchText: '  test  ', clearSearch: jasmine.createSpy(), focus: jasmine.createSpy() } as any;
      mockBarCodeService.getBarCodes.calls.reset();

      component.onEnterSearch();

      expect(component.requestState.searchKeyword).toBe('test');
    });
  });

  describe('Sort', () => {
    beforeEach(() => {
      mockBarCodeService.getBarCodes.and.returnValue(
        of({ data: [...mockBarCodeData], totalRecords: 2 })
      );
      fixture.detectChanges();
    });

    it('should update sort config and sort data on sort change', () => {
      component.onSortChange({ column: 'testId', direction: 'A' });

      expect(component.tableConfig.sortConfig!.column).toBe('testId');
      expect(component.tableConfig.sortConfig!.direction).toBe('A');
    });

    it('should sort ascending by string field', () => {
      component.dataSource = [
        { barcodeValue: 'C', testId: 'T3' },
        { barcodeValue: 'A', testId: 'T1' },
        { barcodeValue: 'B', testId: 'T2' }
      ];

      component.onSortChange({ column: 'barcodeValue', direction: 'A' });

      expect(component.dataSource[0].barcodeValue).toBe('A');
      expect(component.dataSource[1].barcodeValue).toBe('B');
      expect(component.dataSource[2].barcodeValue).toBe('C');
    });

    it('should sort descending by string field', () => {
      component.dataSource = [
        { barcodeValue: 'A', testId: 'T1' },
        { barcodeValue: 'C', testId: 'T3' },
        { barcodeValue: 'B', testId: 'T2' }
      ];

      component.onSortChange({ column: 'barcodeValue', direction: 'D' });

      expect(component.dataSource[0].barcodeValue).toBe('C');
      expect(component.dataSource[1].barcodeValue).toBe('B');
      expect(component.dataSource[2].barcodeValue).toBe('A');
    });

    it('should push null values to end regardless of sort direction', () => {
      component.dataSource = [
        { barcodeValue: 'B', barcodeDesc: null },
        { barcodeValue: 'A', barcodeDesc: 'Alpha' },
        { barcodeValue: 'C', barcodeDesc: null }
      ];

      component.onSortChange({ column: 'barcodeDesc', direction: 'A' });

      expect(component.dataSource[0].barcodeDesc).toBe('Alpha');
      expect(component.dataSource[1].barcodeDesc).toBeNull();
      expect(component.dataSource[2].barcodeDesc).toBeNull();
    });

    it('should push null values to end in descending sort', () => {
      component.dataSource = [
        { barcodeValue: 'A', barcodeDesc: null },
        { barcodeValue: 'B', barcodeDesc: 'Beta' },
        { barcodeValue: 'C', barcodeDesc: 'Charlie' }
      ];

      component.onSortChange({ column: 'barcodeDesc', direction: 'D' });

      expect(component.dataSource[0].barcodeDesc).not.toBeNull();
      expect(component.dataSource[1].barcodeDesc).not.toBeNull();
      expect(component.dataSource[2].barcodeDesc).toBeNull();
    });

    it('should return 0 when both values are null', () => {
      component.dataSource = [
        { barcodeValue: 'A', barcodeDesc: null },
        { barcodeValue: 'B', barcodeDesc: null }
      ];

      component.onSortChange({ column: 'barcodeDesc', direction: 'A' });

      expect(component.dataSource.length).toBe(2);
    });

    it('should sort numeric fields correctly', () => {
      component.dataSource = [
        { barcodeValue: 'A', prioritySeq: 3 },
        { barcodeValue: 'B', prioritySeq: 1 },
        { barcodeValue: 'C', prioritySeq: 2 }
      ];

      component.onSortChange({ column: 'prioritySeq', direction: 'A' });

      expect(component.dataSource[0].prioritySeq).toBe(1);
      expect(component.dataSource[1].prioritySeq).toBe(2);
      expect(component.dataSource[2].prioritySeq).toBe(3);
    });

    it('should not sort when direction is default', () => {
      const originalData = [...component.dataSource];
      component.onSortChange({ column: 'barcodeValue', direction: 'default' });

      expect(component.dataSource).toEqual(originalData);
    });

    it('should not sort when column is empty', () => {
      component.tableConfig.sortConfig = { column: '', direction: 'A' };
      const originalData = [...component.dataSource];
      component['sortDataSource']();

      expect(component.dataSource).toEqual(originalData);
    });
  });

  describe('Row Actions', () => {
    beforeEach(() => {
      mockBarCodeService.getBarCodes.and.returnValue(
        of({ data: mockBarCodeData, totalRecords: 2 })
      );
      fixture.detectChanges();
    });

    it('should call editRecord when row action is edit', () => {
      spyOn(component, 'editRecord');
      component.onRowAction({ action: 'edit', row: mockBarCodeData[0] });

      expect(component.editRecord).toHaveBeenCalledWith(mockBarCodeData[0]);
    });

    it('should not throw for unknown row action', () => {
      expect(() => {
        component.onRowAction({ action: 'unknown', row: mockBarCodeData[0] });
      }).not.toThrow();
    });
  });

  describe('CRUD Operations', () => {
    beforeEach(() => {
      mockBarCodeService.getBarCodes.and.returnValue(
        of({ data: mockBarCodeData, totalRecords: 2 })
      );
      fixture.detectChanges();
    });

    it('should create record and open side panel in add mode', () => {
      component.createRecord();

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelOpen).toBe(true);
    });

    it('should edit record', () => {
      component.editRecord(mockBarCodeData[0]);

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockBarCodeData[0]);
      expect(component.sidePanelOpen).toBe(true);
    });

    it('should close side panel and clear data', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockBarCodeData[0];

      component.closeSidePanel();

      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });

    it('should clear filter data and reload on save success', () => {
      spyOn(filterDataService, 'clearData');
      mockBarCodeService.getBarCodes.calls.reset();

      component.onSaveSuccess();

      expect(filterDataService.clearData).toHaveBeenCalledWith('bar-code');
      expect(mockBarCodeService.getBarCodes).toHaveBeenCalled();
    });
  });

  describe('Filter Functionality', () => {
    beforeEach(() => {
      mockBarCodeService.getBarCodes.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
    });

    it('should apply test ID filter', () => {
      const filters: BarCodeFilterValue = {
        testId: 'T001',
        resultCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestState.testId).toBe('T001');
      expect(component.appliedFilters).toBe(filters);
    });

    it('should apply result code filter', () => {
      const filters: BarCodeFilterValue = {
        testId: null,
        resultCode: 'N',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestState.resultCode).toBe('N');
    });

    it('should apply effective date after filter', () => {
      const filters: BarCodeFilterValue = {
        testId: null,
        resultCode: null,
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-06-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestState.effDateAfter).toBeTruthy();
      expect(component.requestState.effDateBefore).toBeUndefined();
    });

    it('should apply effective date before filter', () => {
      const filters: BarCodeFilterValue = {
        testId: null,
        resultCode: null,
        effectiveDatePeriod: 'before',
        effectiveDate: new Date('2024-06-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestState.effDateBefore).toBeTruthy();
      expect(component.requestState.effDateAfter).toBeUndefined();
    });

    it('should apply termination date after filter', () => {
      const filters: BarCodeFilterValue = {
        testId: null,
        resultCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'after',
        terminationDate: new Date('2025-12-31')
      };

      component.applyFilters(filters);

      expect(component.requestState.termDateAfter).toBeTruthy();
      expect(component.requestState.termDateBefore).toBeUndefined();
    });

    it('should apply termination date before filter', () => {
      const filters: BarCodeFilterValue = {
        testId: null,
        resultCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: new Date('2025-12-31')
      };

      component.applyFilters(filters);

      expect(component.requestState.termDateBefore).toBeTruthy();
      expect(component.requestState.termDateAfter).toBeUndefined();
    });

    it('should set undefined for date filters when date is null but period is set', () => {
      const filters: BarCodeFilterValue = {
        testId: null,
        resultCode: null,
        effectiveDatePeriod: 'after',
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestState.effDateAfter).toBeUndefined();
      expect(component.requestState.termDateBefore).toBeUndefined();
    });

    it('should set undefined for date filters when period does not match', () => {
      const filters: BarCodeFilterValue = {
        testId: null,
        resultCode: null,
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-06-15'),
        terminationDatePeriod: 'after',
        terminationDate: new Date('2025-12-31')
      };

      component.applyFilters(filters);

      expect(component.requestState.effDateBefore).toBeUndefined();
      expect(component.requestState.termDateBefore).toBeUndefined();
    });

    it('should generate filter chips when applying filters', () => {
      const filters: BarCodeFilterValue = {
        testId: 'T001',
        resultCode: 'N',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.filterChips.length).toBeGreaterThan(0);
    });

    it('should call loadData after applying filters', () => {
      mockBarCodeService.getBarCodes.calls.reset();

      const filters: BarCodeFilterValue = {
        testId: 'T001',
        resultCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(mockBarCodeService.getBarCodes).toHaveBeenCalled();
    });

    it('should preserve existing requestState keys when applying filters', () => {
      component.requestState = { searchKeyword: 'test' };

      const filters: BarCodeFilterValue = {
        testId: 'T001',
        resultCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestState.searchKeyword).toBe('test');
      expect(component.requestState.testId).toBe('T001');
    });
  });

  describe('Filter Chip Management', () => {
    beforeEach(() => {
      mockBarCodeService.getBarCodes.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
    });

    it('should remove filter chip and reload data', () => {
      component.appliedFilters = {
        testId: 'T001',
        resultCode: 'N',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      mockBarCodeService.getBarCodes.calls.reset();
      component.onRemoveFilterChip('testId');

      expect(mockBarCodeService.getBarCodes).toHaveBeenCalled();
    });

    it('should update filterChips after removing a chip', () => {
      component.appliedFilters = {
        testId: 'T001',
        resultCode: 'N',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.onRemoveFilterChip('testId');

      const hasTestIdChip = component.filterChips.some(c => c.key === 'testId');
      expect(hasTestIdChip).toBe(false);
    });

    it('should set appliedFilters to null when all chips are removed', () => {
      component.appliedFilters = {
        testId: 'T001',
        resultCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.onRemoveFilterChip('testId');

      expect(component.appliedFilters).toBeNull();
    });

    it('should return false for hasActiveFilters when no filters applied', () => {
      component.appliedFilters = null;
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should return true for hasActiveFilters when filters are applied', () => {
      component.appliedFilters = {
        testId: 'T001',
        resultCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should return false for hasActiveFilters when all filter values are null', () => {
      component.appliedFilters = {
        testId: null,
        resultCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should clear all filters and reload', () => {
      component.appliedFilters = {
        testId: 'T001',
        resultCode: 'N',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.filterChips = [{ key: 'testId', label: 'Test ID: T001', value: 'T001' }];
      component.requestState = { testId: 'T001', resultCode: 'N', searchKeyword: 'test' };

      mockBarCodeService.getBarCodes.calls.reset();
      component.clearAllFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.requestState.testId).toBeUndefined();
      expect(component.requestState.resultCode).toBeUndefined();
      expect(component.requestState.searchKeyword).toBe('test');
      expect(mockBarCodeService.getBarCodes).toHaveBeenCalled();
    });

    it('should clear all date filter keys from requestState', () => {
      component.requestState = {
        testId: 'T001',
        resultCode: 'N',
        effDateAfter: '2024-01-01',
        effDateBefore: '2024-12-31',
        termDateAfter: '2025-01-01',
        termDateBefore: '2025-12-31'
      };

      component.clearAllFilters();

      expect(component.requestState.effDateAfter).toBeUndefined();
      expect(component.requestState.effDateBefore).toBeUndefined();
      expect(component.requestState.termDateAfter).toBeUndefined();
      expect(component.requestState.termDateBefore).toBeUndefined();
    });
  });

  describe('updateRequestStateFromFilters', () => {
    beforeEach(() => {
      mockBarCodeService.getBarCodes.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
    });

    it('should strip filter keys from requestState when appliedFilters is null', () => {
      component.requestState = {
        testId: 'T001',
        resultCode: 'N',
        effDateAfter: '2024-01-01',
        effDateBefore: '2024-12-31',
        termDateAfter: '2025-01-01',
        termDateBefore: '2025-12-31',
        searchKeyword: 'test'
      };
      component.appliedFilters = null;

      component['updateRequestStateFromFilters']();

      expect(component.requestState.testId).toBeUndefined();
      expect(component.requestState.resultCode).toBeUndefined();
      expect(component.requestState.effDateAfter).toBeUndefined();
      expect(component.requestState.effDateBefore).toBeUndefined();
      expect(component.requestState.termDateAfter).toBeUndefined();
      expect(component.requestState.termDateBefore).toBeUndefined();
      expect(component.requestState.searchKeyword).toBe('test');
    });

    it('should update requestState from appliedFilters with non-date fields', () => {
      component.appliedFilters = {
        testId: 'T002',
        resultCode: 'P',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component['updateRequestStateFromFilters']();

      expect(component.requestState.testId).toBe('T002');
      expect(component.requestState.resultCode).toBe('P');
      expect(component.requestState.effDateAfter).toBeUndefined();
      expect(component.requestState.effDateBefore).toBeUndefined();
      expect(component.requestState.termDateAfter).toBeUndefined();
      expect(component.requestState.termDateBefore).toBeUndefined();
    });

    it('should set undefined for empty testId and resultCode', () => {
      component.appliedFilters = {
        testId: '',
        resultCode: '',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component['updateRequestStateFromFilters']();

      expect(component.requestState.testId).toBeUndefined();
      expect(component.requestState.resultCode).toBeUndefined();
    });
  });

  describe('Format Helpers', () => {
    beforeEach(() => {
      mockBarCodeService.getBarCodes.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
    });

    it('should format valid date string', () => {
      expect(component['formatDate']('2024-01-01')).toBe('01-JAN-2024');
    });

    it('should format UTC date near midnight without timezone shift', () => {
      const formatted = component['formatDate']('2026-04-19T23:00:00Z');
      expect(formatted).toBe('19-APR-2026');
    });

    it('should format date with various months', () => {
      expect(component['formatDate']('2024-06-15')).toBe('15-JUN-2024');
      expect(component['formatDate']('2024-12-25')).toBe('25-DEC-2024');
      expect(component['formatDate']('2024-03-01')).toBe('01-MAR-2024');
    });

    it('should return dash for null date', () => {
      expect(component['formatDate'](null)).toBe('-');
    });

    it('should return dash for undefined date', () => {
      expect(component['formatDate'](undefined)).toBe('-');
    });

    it('should return dash for empty string date', () => {
      expect(component['formatDate']('')).toBe('-');
    });

    it('should format result code N as Negative', () => {
      expect(component['formatResultCode']('N')).toBe('Negative');
    });

    it('should format result code P as Positive', () => {
      expect(component['formatResultCode']('P')).toBe('Positive');
    });

    it('should format null result code as dash', () => {
      expect(component['formatResultCode'](null)).toBe('-');
    });

    it('should format undefined result code as dash', () => {
      expect(component['formatResultCode'](undefined)).toBe('-');
    });

    it('should format empty string result code as dash', () => {
      expect(component['formatResultCode']('')).toBe('-');
    });

    it('should return unknown code as-is for unrecognized result codes', () => {
      expect(component['formatResultCode']('X')).toBe('X');
      expect(component['formatResultCode']('ABC')).toBe('ABC');
    });

    it('should format lowercase result codes correctly', () => {
      expect(component['formatResultCode']('n')).toBe('Negative');
      expect(component['formatResultCode']('p')).toBe('Positive');
    });
  });

  describe('Mode Change', () => {
    beforeEach(() => {
      mockBarCodeService.getBarCodes.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
    });

    it('should handle mode change to add', () => {
      component.onModeChange('add');

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should handle mode change to edit without clearing data', () => {
      component.sidePanelData = mockBarCodeData[0];

      component.onModeChange('edit');

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockBarCodeData[0]);
    });

    it('should clear sidePanelData when switching from edit to add', () => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockBarCodeData[0];

      component.onModeChange('add');

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('Chapter Changes', () => {
    beforeEach(() => {
      mockBarCodeService.getBarCodes.and.returnValue(
        of({ data: mockBarCodeData, totalRecords: 2 })
      );
      fixture.detectChanges();
    });

    it('should reset all state when chapter changes', () => {
      // Set up some state
      component.sidePanelOpen = true;
      component.appliedFilters = {
        testId: 'T001',
        resultCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.filterChips = [{ key: 'testId', label: 'Test ID: T001', value: 'T001' }];
      component.searchText = 'search';
      component.requestState = { testId: 'T001', searchKeyword: 'search' };

      spyOn(filterDataService, 'clearData');
      mockBarCodeService.getBarCodes.calls.reset();

      chapterChangedSubject.next();

      expect(component.sidePanelOpen).toBe(false);
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.searchText).toBe('');
      expect(component.requestState).toEqual({});
      expect(filterDataService.clearData).toHaveBeenCalledWith('bar-code');
      expect(mockBarCodeService.getBarCodes).toHaveBeenCalled();
    });

    it('should clear search bar when chapter changes and searchBarComponent exists', () => {
      const mockSearchBar = { clearSearch: jasmine.createSpy('clearSearch'), searchText: '', focus: jasmine.createSpy() };
      component.searchBarComponent = mockSearchBar as any;

      chapterChangedSubject.next();

      expect(mockSearchBar.clearSearch).toHaveBeenCalled();
    });

    it('should reset sort config direction to default when chapter changes', () => {
      component.tableConfig.sortConfig!.direction = 'A';

      chapterChangedSubject.next();

      expect(component.tableConfig.sortConfig!.direction).toBe('default');
    });

    it('should dispose overlay when chapter changes and overlay is open', () => {
      component['overlayRef'] = mockOverlayRef;
      component.isFilterOpen = true;

      chapterChangedSubject.next();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should not throw when chapter changes and searchBarComponent is undefined', () => {
      component.searchBarComponent = undefined as any;

      expect(() => {
        chapterChangedSubject.next();
      }).not.toThrow();
    });

    it('should not throw when chapter changes and overlayRef is null', () => {
      component['overlayRef'] = null;

      expect(() => {
        chapterChangedSubject.next();
      }).not.toThrow();
    });
  });

  describe('openFilter', () => {
    beforeEach(() => {
      mockBarCodeService.getBarCodes.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
      component.tableCard = new ElementRef(document.createElement('div'));
    });

    afterEach(() => {
      if (component['overlayRef']) {
        component['overlayRef'].dispose();
        component['overlayRef'] = null;
      }
    });

    it('should close filter overlay if already open and return', () => {
      component['overlayRef'] = mockOverlayRef;
      component.isFilterOpen = true;

      component.openFilter();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should create overlay and set isFilterOpen to true', () => {
      component.openFilter();

      expect(component.isFilterOpen).toBe(true);
      expect(component['overlayRef']).toBeTruthy();
    });

    it('should set overlayRef when opening filter', () => {
      expect(component['overlayRef']).toBeNull();

      component.openFilter();

      expect(component['overlayRef']).not.toBeNull();
    });

    it('should toggle filter off then on', () => {
      component['overlayRef'] = mockOverlayRef;
      component.isFilterOpen = true;

      component.openFilter();

      expect(component.isFilterOpen).toBe(false);
      expect(component['overlayRef']).toBeNull();
    });
  });

  describe('closeFilterOverlay', () => {
    beforeEach(() => {
      mockBarCodeService.getBarCodes.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
    });

    it('should dispose overlay and reset state', () => {
      component['overlayRef'] = mockOverlayRef;
      component.isFilterOpen = true;

      component['closeFilterOverlay']();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should do nothing when overlayRef is null', () => {
      component['overlayRef'] = null;
      component.isFilterOpen = false;

      component['closeFilterOverlay']();

      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });
  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(() => {
      mockBarCodeService.getBarCodes.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
    });

    it('should create new record on Alt+C', () => {
      spyOn(component, 'createRecord');
      const event = new KeyboardEvent('keydown', { key: 'c', altKey: true });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.createRecord).toHaveBeenCalled();
    });

    it('should focus search on Alt+S', () => {
      const mockSearchBar = { focus: jasmine.createSpy('focus'), searchText: '', clearSearch: jasmine.createSpy() };
      component.searchBarComponent = mockSearchBar as any;

      const event = new KeyboardEvent('keydown', { key: 's', altKey: true });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockSearchBar.focus).toHaveBeenCalled();
    });

    it('should open filter on Alt+F', () => {
      component.tableCard = new ElementRef(document.createElement('div'));
      const event = new KeyboardEvent('keydown', { key: 'f', altKey: true });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should close filter overlay on Escape when overlay is open', () => {
      component['overlayRef'] = mockOverlayRef;
      component.isFilterOpen = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should close side panel on Escape when side panel is open', () => {
      component.sidePanelOpen = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBe(false);
    });

    it('should handle uppercase key for Alt+C', () => {
      spyOn(component, 'createRecord');
      const event = new KeyboardEvent('keydown', { key: 'C', altKey: true });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(component.createRecord).toHaveBeenCalled();
    });

    it('should not trigger shortcuts without Alt key for letter shortcuts', () => {
      spyOn(component, 'createRecord');
      const event = new KeyboardEvent('keydown', { key: 'c', altKey: false });

      component.handleKeyboardShortcut(event);

      expect(component.createRecord).not.toHaveBeenCalled();
    });

    it('should not close overlay on Escape when no overlay is open', () => {
      component['overlayRef'] = null;
      component.sidePanelOpen = false;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });

      expect(() => {
        component.handleKeyboardShortcut(event);
      }).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      mockBarCodeService.getBarCodes.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
    });

    it('should complete destroy$ subject', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });

    it('should dispose overlayRef if it exists', () => {
      component['overlayRef'] = mockOverlayRef;

      component.ngOnDestroy();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
    });

    it('should not throw if overlayRef is null on destroy', () => {
      component['overlayRef'] = null;

      expect(() => {
        component.ngOnDestroy();
      }).not.toThrow();
    });
  });
});
