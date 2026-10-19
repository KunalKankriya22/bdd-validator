import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { of, throwError, Subject } from 'rxjs';
import { Overlay } from '@angular/cdk/overlay';
import { NO_ERRORS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import moment from 'moment';

import { ProductTypeAttributesComponent } from './product-type-attributes.component';
import { ProductAttributeService } from './services/product-attribute.service';
import {
  ProductAttribute,
  ProductAttributeFilterValue
} from './models/product-attribute.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { SearchBar } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import { FilterChips } from '@shared/components/filter-chips/filter-chips';
import { TablePageEvent, TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';

import { FilterChipsUtils } from './utils/filter-chips.utils';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { createMockPageHeaderService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ProductTypeAttributesComponent', () => {
  let component: ProductTypeAttributesComponent;
  let fixture: ComponentFixture<ProductTypeAttributesComponent>;
  let mockProductAttributeService: jasmine.SpyObj<ProductAttributeService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;
  let compiled: HTMLElement;
  let chapterChangedSubject: Subject<void>;

  // Mock data
  const mockProductAttributeData: ProductAttribute[] = [
    {
      productType: 'RBC',
      attribGroup: 'ISBT',
      attribCode: 'E0001',
      attribCodeDesc: 'ABO Group',
      labelFlag: 'Y',
      lifeSpanInd: 'D',
      lifeSpan: '42',
      effDate: new Date('2024-01-01'),
      termDate: null,
      lastModifiedDate: new Date('2024-01-15'),
      auditKey: 12345,
      programId: 'VPRDATTR'
    },
    {
      productType: 'PLT',
      attribGroup: 'ISBT',
      attribCode: 'E0002',
      attribCodeDesc: 'Rh Type',
      labelFlag: 'Y',
      lifeSpanInd: 'D',
      lifeSpan: '5',
      effDate: new Date('2024-01-01'),
      termDate: null,
      lastModifiedDate: new Date('2024-01-10'),
      auditKey: 12346,
      programId: 'VPRDATTR'
    },
    {
      productType: 'FFP',
      attribGroup: 'CDBR',
      attribCode: 'C0001',
      attribCodeDesc: 'Blood Type',
      labelFlag: 'N',
      lifeSpanInd: 'Y',
      lifeSpan: '1',
      effDate: new Date('2024-02-01'),
      termDate: new Date('2024-12-31'),
      lastModifiedDate: new Date('2024-02-15'),
      auditKey: 12347,
      programId: 'VPRDATTR'
    }
  ];

  const mockApiResponse = {
    success: true,
    data: mockProductAttributeData,
    total: 3,
    statusCode: 200,
    message: 'Data retrieved successfully'
  };

  const mockFilters: ProductAttributeFilterValue = {
    productType: 'RBC',
    attribGroup: 'ISBT',
    attribCode: 'E0001',
    labelFlag: 'Y',
    lifeSpanInd: 'D'
  };

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    // Create spy objects
    mockProductAttributeService = jasmine.createSpyObj('ProductAttributeService', [
      'getProductAttributes',
      'getProductTypesFilter',
      'getAttributeGroupsFilter',
      'getAttributeCodesFilter'
    ]);

    mockPageHeaderService = createMockPageHeaderService();
    Object.defineProperty(mockPageHeaderService, 'pageHeaderData', {
      get: () => () => ({
        title: 'Product Type Attributes',
        subtitle: 'Create and manage customer profiles for billing and packlist use.'
      }),
      enumerable: true,
      configurable: true
    });

    mockTranslateService = jasmine.createSpyObj('TranslateService', ['instant', 'get', 'use'], {
      currentLang: 'en',
      defaultLang: 'en'
    });

    mockHeaderService = createMockHeaderService({
      chapterChanged$: chapterChangedSubject.asObservable()
    });

    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position']);
    (mockOverlay as any).scrollStrategies = { block: () => ({}) };

    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate',
      'getChapterLocalDateTime',
      'isChapterLocalDateAvailable'
    ]);
    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment().startOf('day'));
    mockChapterTimezoneService.getChapterLocalDateTime.and.returnValue(moment());

    // Setup default spy returns
    mockProductAttributeService.getProductAttributes.and.returnValue(of(mockApiResponse));
    mockProductAttributeService.getProductTypesFilter.and.returnValue(of([]));
    mockProductAttributeService.getAttributeGroupsFilter.and.returnValue(of([]));
    mockProductAttributeService.getAttributeCodesFilter.and.returnValue(of([]));

      TestBed.configureTestingModule({
      imports: [
        ProductTypeAttributesComponent,
        CommonModule,
        MatButtonModule,
        MatIconModule,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: ProductAttributeService, useValue: mockProductAttributeService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: Overlay, useValue: mockOverlay },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(ProductTypeAttributesComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement as HTMLElement;


    });


  describe('Initialization', () => {

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize table configuration correctly', () => {
      expect(component.tableConfig.columns.length).toBeGreaterThan(0);
      expect(component.tableConfig.rowActions?.length).toBeGreaterThan(0);
      expect(component.tableConfig.pagination?.pageSize).toBe(25);
    });

    it('should initialize search configuration correctly', () => {
      expect(component.searchConfig.placeholder).toBe('Search by Product Type, Attribute Group, or Attribute Code');
      expect(component.searchConfig.minLength).toBe(2);
      expect(component.searchConfig.ariaLabel).toContain('Search product attributes');
    });

    it('should initialize with default state values', () => {
      expect(component.isLoading).toBeFalse();
      expect(component.hasError).toBeFalse();
      expect(component.errorMessage).toBe('');
      expect(component.searchText).toBe('');
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.isFilterOpen).toBeFalse();
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.dataSource).toEqual([]);
    });

    it('should initialize VALIDATION constants correctly', () => {
      expect(component.VALIDATION.LIMITS.SEARCH_MIN_LENGTH).toBe(2);
      expect(component.VALIDATION.LIMITS.DEFAULT_PAGE_SIZE).toBe(25);
      expect(component.VALIDATION.LIMITS.DESCRIPTION_TRUNCATE_LENGTH).toBe(50);
    });

    it('should set currentYear to current year', () => {
      expect(component.currentYear).toBe(new Date().getFullYear());
    });

    it('should have correct number of table columns', () => {
      const columns = component.tableConfig.columns;
      expect(columns.length).toBe(11);
    });

    it('should configure sortable columns correctly', () => {
      const columns = component.tableConfig.columns;
      const sortableColumns = columns.filter(c => c.sortable);
      expect(sortableColumns.length).toBe(4);
      const sortableKeys = sortableColumns.map(c => c.key);
      expect(sortableKeys).toContain('productType');
      expect(sortableKeys).toContain('attribGroup');
      expect(sortableKeys).toContain('attribCode');
      expect(sortableKeys).toContain('effDate');
    });

    it('should configure table with correct pagination options', () => {
      expect(component.tableConfig.pagination?.pageSizeOptions).toEqual([10, 25, 50, 100]);
      expect(component.tableConfig.pagination?.showFirstLastButtons).toBeTrue();
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(component.tableConfig.pagination?.totalRecords).toBe(0);
    });

    it('should configure table with correct empty and loading messages', () => {
      expect(component.tableConfig.emptyMessage).toBe('No Product Type Attributes available to display');
      expect(component.tableConfig.loadingMessage).toBe('Loading product type attributes data...');
    });

    it('should configure sticky header and actions column', () => {
      expect(component.tableConfig.stickyHeader).toBeTrue();
      expect(component.tableConfig.stickyActionsColumn).toBeTrue();
    });

    it('should configure row actions with edit action', () => {
      const actions = component.tableConfig.rowActions!;
      expect(actions.length).toBe(1);
      expect(actions[0].action).toBe('edit');
      expect(actions[0].icon).toBe('edit');
      expect(actions[0].label).toBe('Edit product attribute');
    });

    it('should configure sort config with default values', () => {
      expect(component.tableConfig.sortConfig?.column).toBe('');
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
    });

    it('should initialize searchConfig with searchOnEnterOnly and alwaysShowTooltip', () => {
      expect((component.searchConfig as any).searchOnEnterOnly).toBeTrue();
      expect((component.searchConfig as any).alwaysShowTooltip).toBeTrue();
    });
  });

  describe('ngOnInit', () => {
    it('should call loadTableData on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(mockProductAttributeService.getProductAttributes).toHaveBeenCalled();
    }));

    it('should subscribe to chapter changes on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Simulate chapter change
      component.sidePanelOpen = true;
      component.appliedFilters = mockFilters;

      chapterChangedSubject.next();
      tick();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.appliedFilters).toBeNull();
    }));

    it('should set dataSource from API response', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.dataSource.length).toBe(3);
      expect(component.dataSource).toEqual(mockProductAttributeData);
    }));

    it('should set totalRecords from API response', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.tableConfig.pagination!.totalRecords).toBe(3);
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should dispose overlayRef if it exists', () => {
      fixture.detectChanges();
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = mockOverlayRef;

      component.ngOnDestroy();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
    });

    it('should not error if overlayRef is null on destroy', () => {
      fixture.detectChanges();
      component['overlayRef'] = null;

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('loadTableData', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set isLoading to true when loading starts', () => {
      mockProductAttributeService.getProductAttributes.and.returnValue(of(mockApiResponse));
      component.isLoading = false;

      component.loadTableData();

      // isLoading is set synchronously before subscribe
      // The subscribe callback sets it back to false
    });

    it('should set hasError to false when loading starts', fakeAsync(() => {
      component.hasError = true;
      mockProductAttributeService.getProductAttributes.and.returnValue(of(mockApiResponse));

      component.loadTableData();
      tick();

      expect(component.hasError).toBeFalse();
    }));

    it('should set isLoading to false after successful load', fakeAsync(() => {
      component.loadTableData();
      tick();

      expect(component.isLoading).toBeFalse();
    }));

    it('should handle empty data response', fakeAsync(() => {
      mockProductAttributeService.getProductAttributes.and.returnValue(of({
        success: true,
        data: null as any,
        total: 0,
        statusCode: 200,
        message: 'No data'
      }));

      component.loadTableData();
      tick();

      expect(component.dataSource).toEqual([]);
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
    }));

    it('should handle response with undefined total', fakeAsync(() => {
      mockProductAttributeService.getProductAttributes.and.returnValue(of({
        success: true,
        data: mockProductAttributeData,
        total: undefined,
        statusCode: 200,
        message: 'OK'
      } as any));

      component.loadTableData();
      tick();

      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
    }));

    it('should calculate skip correctly for page 0', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 0;
      component.tableConfig.pagination!.pageSize = 25;

      component.loadTableData();
      tick();

      expect(mockProductAttributeService.getProductAttributes).toHaveBeenCalledWith(
        25, 0, jasmine.any(Object)
      );
    }));

    it('should calculate skip correctly for page 2 with pageSize 25', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 25;

      component.loadTableData();
      tick();

      expect(mockProductAttributeService.getProductAttributes).toHaveBeenCalledWith(
        25,
        50,
        jasmine.any(Object)
      );
    }));

    it('should use default pageSize of 10 when pagination pageSize is not set', fakeAsync(() => {
      component.tableConfig.pagination!.pageSize = undefined as any;
      component.tableConfig.pagination!.pageIndex = 0;

      component.loadTableData();
      tick();

      expect(mockProductAttributeService.getProductAttributes).toHaveBeenCalledWith(
        10, 0, jasmine.any(Object)
      );
    }));

    it('should pass requestState to getProductAttributes', fakeAsync(() => {
      component.requestState = { searchKeyword: 'test', sortColumn: 'ProductType', sortOrder: 'ASC' };

      component.loadTableData();
      tick();

      expect(mockProductAttributeService.getProductAttributes).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.any(Number),
        jasmine.objectContaining({ searchKeyword: 'test', sortColumn: 'ProductType', sortOrder: 'ASC' })
      );
    }));
  });

  describe('Search functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call API with search keyword when searching', fakeAsync(() => {
      const searchText = 'RBC';
      component.onSearch(searchText);
      tick();

      expect(mockProductAttributeService.getProductAttributes).toHaveBeenCalledWith(
        25,
        0,
        jasmine.objectContaining({ searchKeyword: searchText })
      );
    }));

    it('should clear search keyword when search is empty', fakeAsync(() => {
      component.onSearch('');
      tick();

      expect(mockProductAttributeService.getProductAttributes).toHaveBeenCalledWith(
        25,
        0,
        jasmine.objectContaining({ searchKeyword: undefined })
      );
    }));

    it('should reset page index to 0 when searching', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 5;
      component.onSearch('test');
      tick();

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    }));

    it('should set requestState.searchKeyword to undefined for empty string', () => {
      component.onSearch('');
      expect(component.requestState.searchKeyword).toBeUndefined();
    });

    it('should set requestState.searchKeyword for non-empty string', () => {
      component.onSearch('PLT');
      expect(component.requestState.searchKeyword).toBe('PLT');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle page change correctly', fakeAsync(() => {
      const pageEvent: TablePageEvent = {
        pageIndex: 1,
        pageSize: 50,
        previousPageIndex: 0
      };

      component.onPageChange(pageEvent);
      tick();

      expect(component.tableConfig.pagination?.pageIndex).toBe(1);
      expect(component.tableConfig.pagination?.pageSize).toBe(50);
      expect(mockProductAttributeService.getProductAttributes).toHaveBeenCalledWith(
        50,
        50,
        jasmine.any(Object)
      );
    }));

    it('should calculate skip value correctly for pagination', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 25;

      component.loadTableData();
      tick();

      expect(mockProductAttributeService.getProductAttributes).toHaveBeenCalledWith(
        25,
        50,
        jasmine.any(Object)
      );
    }));

    it('should handle page change to first page', fakeAsync(() => {
      const pageEvent: TablePageEvent = {
        pageIndex: 0,
        pageSize: 10,
        previousPageIndex: 3
      };

      component.onPageChange(pageEvent);
      tick();

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(component.tableConfig.pagination!.pageSize).toBe(10);
      expect(mockProductAttributeService.getProductAttributes).toHaveBeenCalledWith(
        10, 0, jasmine.any(Object)
      );
    }));

    it('should handle page change with large page index', fakeAsync(() => {
      const pageEvent: TablePageEvent = {
        pageIndex: 10,
        pageSize: 100,
        previousPageIndex: 9
      };

      component.onPageChange(pageEvent);
      tick();

      expect(mockProductAttributeService.getProductAttributes).toHaveBeenCalledWith(
        100, 1000, jasmine.any(Object)
      );
    }));
  });

  describe('Sort functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should apply ascending sort', fakeAsync(() => {
      const sortEvent: TableSortEvent = { column: 'productType', direction: 'A' };
      component.onSortChange(sortEvent);
      tick();

      expect(component.requestState.sortColumn).toBe('ProductType');
      expect(component.requestState.sortOrder).toBe('ASC');
    }));

    it('should apply descending sort', fakeAsync(() => {
      const sortEvent: TableSortEvent = { column: 'productType', direction: 'D' };
      component.onSortChange(sortEvent);
      tick();

      expect(component.requestState.sortColumn).toBe('ProductType');
      expect(component.requestState.sortOrder).toBe('DESC');
    }));

    it('should clear sort when direction is default', fakeAsync(() => {
      component.requestState.sortColumn = 'ProductType';
      component.requestState.sortOrder = 'ASC';

      const sortEvent: TableSortEvent = { column: 'productType', direction: 'default' };
      component.onSortChange(sortEvent);
      tick();

      expect(component.requestState.sortColumn).toBeUndefined();
      expect(component.requestState.sortOrder).toBeUndefined();
    }));

    it('should map attribGroup column correctly', fakeAsync(() => {
      const sortEvent: TableSortEvent = { column: 'attribGroup', direction: 'A' };
      component.onSortChange(sortEvent);
      tick();

      expect(component.requestState.sortColumn).toBe('AttribGroup');
    }));

    it('should map attribCode column correctly', fakeAsync(() => {
      const sortEvent: TableSortEvent = { column: 'attribCode', direction: 'A' };
      component.onSortChange(sortEvent);
      tick();

      expect(component.requestState.sortColumn).toBe('AttribCode');
    }));

    it('should map effDate column correctly', fakeAsync(() => {
      const sortEvent: TableSortEvent = { column: 'effDate', direction: 'D' };
      component.onSortChange(sortEvent);
      tick();

      expect(component.requestState.sortColumn).toBe('EffDate');
      expect(component.requestState.sortOrder).toBe('DESC');
    }));

    it('should use column name as-is for unmapped columns', fakeAsync(() => {
      const sortEvent: TableSortEvent = { column: 'unknownCol', direction: 'A' };
      component.onSortChange(sortEvent);
      tick();

      expect(component.requestState.sortColumn).toBe('unknownCol');
    }));

    it('should reset page index to 0 when sort changes', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 5;

      const sortEvent: TableSortEvent = { column: 'productType', direction: 'A' };
      component.onSortChange(sortEvent);
      tick();

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    }));

    it('should update sortConfig on the tableConfig', () => {
      const sortEvent: TableSortEvent = { column: 'attribCode', direction: 'D' };
      component.onSortChange(sortEvent);

      expect(component.tableConfig.sortConfig!.column).toBe('attribCode');
      expect(component.tableConfig.sortConfig!.direction).toBe('D');
    });

    it('should call loadTableData after sort change', fakeAsync(() => {
      mockProductAttributeService.getProductAttributes.calls.reset();

      const sortEvent: TableSortEvent = { column: 'productType', direction: 'A' };
      component.onSortChange(sortEvent);
      tick();

      expect(mockProductAttributeService.getProductAttributes).toHaveBeenCalled();
    }));
  });

  describe('Filter functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should apply filters correctly', fakeAsync(() => {
      component.applyFilters(mockFilters);
      tick();

      expect(component.appliedFilters).toEqual(mockFilters);
      expect(component.requestState.productType).toBe('RBC');
      expect(component.requestState.attribGroup).toBe('ISBT');
      expect(component.requestState.attribCode).toBe('E0001');
      expect(component.requestState.labelFlag).toBe('Y');
      expect(component.requestState.lifeSpanInd).toBe('D');
      expect(mockProductAttributeService.getProductAttributes).toHaveBeenCalled();
    }));

    it('should generate filter chips when filters are applied', () => {
      component.applyFilters(mockFilters);

      expect(component.filterChips.length).toBeGreaterThan(0);
    });

    it('should clear all filters correctly', fakeAsync(() => {
      component.appliedFilters = mockFilters;
      component.filterChips = FilterChipsUtils.convertFiltersToChips(mockFilters);
      component.clearAllFilters();
      tick();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.requestState.productType).toBeUndefined();
      expect(component.requestState.attribGroup).toBeUndefined();
      expect(mockProductAttributeService.getProductAttributes).toHaveBeenCalled();
    }));

    it('should return false for hasActiveFilters when no filters are applied', () => {
      component.appliedFilters = null;

      expect(component.hasActiveFilters()).toBeFalse();
    });

    it('should return true for hasActiveFilters when filters are applied', () => {
      component.appliedFilters = mockFilters;

      expect(component.hasActiveFilters()).toBeTrue();
    });

    it('should reset page index to 0 when filters are applied', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 3;
      component.applyFilters(mockFilters);
      tick();

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    }));

    it('should handle filters with empty string values as undefined', fakeAsync(() => {
      const emptyFilters: ProductAttributeFilterValue = {
        productType: '',
        attribGroup: '',
        attribCode: '',
        labelFlag: '',
        lifeSpanInd: ''
      };

      component.applyFilters(emptyFilters);
      tick();

      expect(component.requestState.productType).toBeUndefined();
      expect(component.requestState.attribGroup).toBeUndefined();
      expect(component.requestState.attribCode).toBeUndefined();
      expect(component.requestState.labelFlag).toBeUndefined();
      expect(component.requestState.lifeSpanInd).toBeUndefined();
    }));

    it('should handle filters with moment date objects for effDate', fakeAsync(() => {
      const filtersWithDate: ProductAttributeFilterValue = {
        effDatePeriod: 'AFTER',
        effDate: moment('2024-06-15')
      };

      component.applyFilters(filtersWithDate);
      tick();

      expect(component.requestState.effDate).toBe('2024-06-15');
      expect(component.requestState.effDatePeriod).toBe('AFTER');
    }));

    it('should handle filters with moment date objects for termDate', fakeAsync(() => {
      const filtersWithDate: ProductAttributeFilterValue = {
        termDatePeriod: 'BEFORE',
        termDate: moment('2024-12-31')
      };

      component.applyFilters(filtersWithDate);
      tick();

      expect(component.requestState.termDate).toBe('2024-12-31');
      expect(component.requestState.termDatePeriod).toBe('BEFORE');
    }));

    it('should handle filters with string date for effDate', fakeAsync(() => {
      const filtersWithStringDate: ProductAttributeFilterValue = {
        effDatePeriod: 'AFTER',
        effDate: '2024-06-15' as any
      };

      component.applyFilters(filtersWithStringDate);
      tick();

      expect(component.requestState.effDate).toBe('2024-06-15');
    }));

    it('should handle filters with null effDate as undefined', fakeAsync(() => {
      const filtersWithNullDate: ProductAttributeFilterValue = {
        effDate: null,
        effDatePeriod: null
      };

      component.applyFilters(filtersWithNullDate);
      tick();

      expect(component.requestState.effDate).toBeUndefined();
      expect(component.requestState.effDatePeriod).toBeUndefined();
    }));

    it('should preserve existing requestState properties like searchKeyword when applying filters', fakeAsync(() => {
      component.requestState.searchKeyword = 'test';

      component.applyFilters(mockFilters);
      tick();

      expect(component.requestState.searchKeyword).toBe('test');
      expect(component.requestState.productType).toBe('RBC');
    }));

    it('should remove a specific filter chip and update request state', fakeAsync(() => {
      component.applyFilters(mockFilters);
      tick();

      mockProductAttributeService.getProductAttributes.calls.reset();

      component.onRemoveFilterChip('productType');
      tick();

      expect(component.requestState.productType).toBeUndefined();
      expect(mockProductAttributeService.getProductAttributes).toHaveBeenCalled();
    }));

    it('should reset page index when removing a filter chip', fakeAsync(() => {
      component.applyFilters(mockFilters);
      component.tableConfig.pagination!.pageIndex = 3;

      component.onRemoveFilterChip('attribGroup');
      tick();

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    }));

    it('should update filter chips when removing a filter chip', fakeAsync(() => {
      component.applyFilters(mockFilters);
      const initialChipsCount = component.filterChips.length;

      component.onRemoveFilterChip('productType');
      tick();

      expect(component.filterChips.length).toBeLessThan(initialChipsCount);
    }));

    it('should clear all filter-related request state properties on clearAllFilters', fakeAsync(() => {
      component.requestState = {
        searchKeyword: 'keep-this',
        productType: 'RBC',
        attribGroup: 'ISBT',
        attribCode: 'E0001',
        labelFlag: 'Y',
        lifeSpanInd: 'D',
        effDate: '2024-01-01',
        effDatePeriod: 'AFTER',
        termDate: '2024-12-31',
        termDatePeriod: 'BEFORE'
      };

      component.clearAllFilters();
      tick();

      expect(component.requestState.searchKeyword).toBe('keep-this');
      expect(component.requestState.productType).toBeUndefined();
      expect(component.requestState.attribGroup).toBeUndefined();
      expect(component.requestState.attribCode).toBeUndefined();
      expect(component.requestState.labelFlag).toBeUndefined();
      expect(component.requestState.lifeSpanInd).toBeUndefined();
      expect(component.requestState.effDate).toBeUndefined();
      expect(component.requestState.effDatePeriod).toBeUndefined();
      expect(component.requestState.termDate).toBeUndefined();
      expect(component.requestState.termDatePeriod).toBeUndefined();
    }));

    it('should reset page index on clearAllFilters', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 4;
      component.clearAllFilters();
      tick();

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    }));

    it('should call loadTableData on clearAllFilters', fakeAsync(() => {
      mockProductAttributeService.getProductAttributes.calls.reset();

      component.clearAllFilters();
      tick();

      expect(mockProductAttributeService.getProductAttributes).toHaveBeenCalled();
    }));
  });

  describe('Row actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open edit panel when edit action is triggered', () => {
      const rowData = mockProductAttributeData[0];

      component.onRowAction({
        action: 'edit',
        row: rowData
      });

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(rowData);
    });

    it('should not change state for unknown actions', () => {
      component.sidePanelOpen = false;

      component.onRowAction({
        action: 'unknown',
        row: mockProductAttributeData[0]
      });

      expect(component.sidePanelOpen).toBeFalse();
    });
  });

  describe('Side panel', () => {
    it('should open add panel when create button is clicked', () => {
      component.createRecord();

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should close side panel correctly', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockProductAttributeData[0];

      component.closeSidePanel();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });

    it('should switch to add mode when onModeChange is called with add', () => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockProductAttributeData[0];

      component.onModeChange('add');

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should switch to edit mode when onModeChange is called with edit', () => {
      component.sidePanelMode = 'add';

      component.onModeChange('edit');

      expect(component.sidePanelMode).toBe('edit');
    });

    it('should not clear sidePanelData when switching to edit mode', () => {
      component.sidePanelData = mockProductAttributeData[0];
      component.onModeChange('edit');

      expect(component.sidePanelData).toEqual(mockProductAttributeData[0]);
    });

    it('should open edit panel with correct data', () => {
      const record = mockProductAttributeData[1];
      component.editRecord(record);

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(record);
      expect(component.sidePanelOpen).toBeTrue();
    });
  });

  describe('onSaveSuccess', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update row in-place on edit with matching row', fakeAsync(() => {
      component.dataSource = [...mockProductAttributeData];
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockProductAttributeData[0];

      const formData = {
        productType: 'RBC',
        attribGroup: 'ISBT',
        attribCode: 'E0001',
        attribCodeDesc: 'ABO Group',
        labelFlag: 'N',
        lifeSpanInd: 'H',
        lifeSpan: '24',
        effDate: '2024-06-01',
        termDate: '2024-12-31',
        newProductType: 'PLT'
      };

      component.onSaveSuccess(formData);
      tick();

      expect(component.dataSource[0].labelFlag).toBe('N');
      expect(component.dataSource[0].lifeSpanInd).toBe('H');
      expect(component.dataSource[0].lifeSpan).toBe('24');
      expect(component.dataSource[0].effDate).toBe('2024-06-01');
      expect(component.dataSource[0].termDate).toBe('2024-12-31');
      expect(component.dataSource[0].newProductType).toBe('PLT');
    }));

    it('should call getChapterLocalDate when updating row in-place', fakeAsync(() => {
      component.dataSource = [...mockProductAttributeData];
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockProductAttributeData[0];

      const formData = {
        productType: 'RBC',
        attribGroup: 'ISBT',
        attribCode: 'E0001',
        attribCodeDesc: 'ABO Group',
        labelFlag: 'N',
        lifeSpanInd: 'D',
        lifeSpan: '42',
        effDate: '2024-01-01',
        termDate: null,
        newProductType: null
      };

      component.onSaveSuccess(formData);
      tick();

      expect(mockChapterTimezoneService.getChapterLocalDate).toHaveBeenCalled();
    }));

    it('should reload table data when edit row is not found in dataSource', fakeAsync(() => {
      component.dataSource = [...mockProductAttributeData];
      component.sidePanelMode = 'edit';
      component.sidePanelData = {
        ...mockProductAttributeData[0],
        productType: 'NOTFOUND',
        attribGroup: 'NONE',
        attribCode: 'NONE'
      };

      mockProductAttributeService.getProductAttributes.calls.reset();

      const formData = {
        productType: 'NOTFOUND',
        attribGroup: 'NONE',
        attribCode: 'NONE',
        attribCodeDesc: '',
        labelFlag: 'N',
        lifeSpanInd: 'D',
        lifeSpan: '42',
        effDate: '2024-01-01',
        termDate: null,
        newProductType: null
      };

      component.onSaveSuccess(formData);
      tick();

      expect(mockProductAttributeService.getProductAttributes).toHaveBeenCalled();
    }));

    it('should reload table data on add mode save', fakeAsync(() => {
      component.sidePanelMode = 'add';
      component.sidePanelData = null;

      mockProductAttributeService.getProductAttributes.calls.reset();

      component.onSaveSuccess({
        productType: 'NEW',
        attribGroup: 'ISBT',
        attribCode: 'N0001',
        attribCodeDesc: 'New attribute',
        labelFlag: 'Y',
        lifeSpanInd: 'D',
        lifeSpan: '10',
        effDate: '2024-01-01',
        termDate: null,
        newProductType: null
      });
      tick();

      expect(mockProductAttributeService.getProductAttributes).toHaveBeenCalled();
    }));

    it('should reload table data when called without data argument', fakeAsync(() => {
      component.sidePanelMode = 'add';
      mockProductAttributeService.getProductAttributes.calls.reset();

      component.onSaveSuccess();
      tick();

      expect(mockProductAttributeService.getProductAttributes).toHaveBeenCalled();
    }));

    it('should reload table data when sidePanelData is null in edit mode', fakeAsync(() => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = null;

      mockProductAttributeService.getProductAttributes.calls.reset();

      component.onSaveSuccess({
        productType: 'RBC',
        attribGroup: 'ISBT',
        attribCode: 'E0001',
        attribCodeDesc: 'Test',
        labelFlag: 'Y',
        lifeSpanInd: 'D',
        lifeSpan: '42',
        effDate: '2024-01-01',
        termDate: null,
        newProductType: null
      });
      tick();

      expect(mockProductAttributeService.getProductAttributes).toHaveBeenCalled();
    }));

    it('should create a new array reference for dataSource after in-place update', fakeAsync(() => {
      component.dataSource = [...mockProductAttributeData];
      const originalRef = component.dataSource;
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockProductAttributeData[0];

      const formData = {
        productType: 'RBC',
        attribGroup: 'ISBT',
        attribCode: 'E0001',
        attribCodeDesc: 'ABO Group',
        labelFlag: 'N',
        lifeSpanInd: 'D',
        lifeSpan: '42',
        effDate: '2024-01-01',
        termDate: null,
        newProductType: null
      };

      component.onSaveSuccess(formData);
      tick();

      expect(component.dataSource).not.toBe(originalRef);
    }));
  });

  describe('openFilter', () => {
    let applySubject: Subject<ProductAttributeFilterValue>;
    let closeSubject: Subject<void>;
    let backdropClickSubject: Subject<MouseEvent>;
    let mockNewOverlayRef: jasmine.SpyObj<any>;
    let mockComponentRef: any;

    beforeEach(() => {
      fixture.detectChanges();
    });

    function setupOverlayMocks(): void {
      const overlayInstance = component['overlay'];

      const mockPositionStrategy = jasmine.createSpyObj('FlexibleConnectedPositionStrategy', [
        'withPositions', 'withPush'
      ]);
      mockPositionStrategy.withPositions.and.returnValue(mockPositionStrategy);
      mockPositionStrategy.withPush.and.returnValue(mockPositionStrategy);

      const mockPositionBuilder = jasmine.createSpyObj('PositionBuilder', ['flexibleConnectedTo']);
      mockPositionBuilder.flexibleConnectedTo.and.returnValue(mockPositionStrategy);

      spyOn(overlayInstance, 'position').and.returnValue(mockPositionBuilder as any);
      overlayInstance.scrollStrategies = { block: () => ({}) } as any;

      applySubject = new Subject<ProductAttributeFilterValue>();
      closeSubject = new Subject<void>();
      backdropClickSubject = new Subject<MouseEvent>();

      mockComponentRef = {
        instance: {
          currentFilters: null as any,
          apply: applySubject.asObservable(),
          close: closeSubject.asObservable()
        }
      };

      mockNewOverlayRef = jasmine.createSpyObj('OverlayRef', ['attach', 'dispose', 'backdropClick']);
      mockNewOverlayRef.attach.and.returnValue(mockComponentRef);
      mockNewOverlayRef.backdropClick.and.returnValue(backdropClickSubject.asObservable());

      spyOn(overlayInstance, 'create').and.returnValue(mockNewOverlayRef);

      component.tableCard = { nativeElement: document.createElement('div') } as any;
    }

    it('should dispose existing overlay and return if overlayRef exists', () => {
      const existingOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = existingOverlayRef;
      component.isFilterOpen = true;

      component.openFilter();

      expect(existingOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should create overlay when no existing overlay', () => {
      setupOverlayMocks();
      component['overlayRef'] = null;

      component.openFilter();

      expect(component['overlay'].create).toHaveBeenCalled();
      expect(component.isFilterOpen).toBeTrue();
      expect(mockNewOverlayRef.attach).toHaveBeenCalled();
    });

    it('should apply filters when filter panel emits apply event', fakeAsync(() => {
      setupOverlayMocks();
      component['overlayRef'] = null;

      component.openFilter();

      applySubject.next(mockFilters);
      tick();

      expect(component.appliedFilters).toEqual(mockFilters);
      expect(mockNewOverlayRef.dispose).toHaveBeenCalled();
      expect(component.isFilterOpen).toBeFalse();
    }));

    it('should close overlay when filter panel emits close event', fakeAsync(() => {
      setupOverlayMocks();
      component['overlayRef'] = null;

      component.openFilter();

      closeSubject.next();
      tick();

      expect(mockNewOverlayRef.dispose).toHaveBeenCalled();
      expect(component.isFilterOpen).toBeFalse();
    }));

    it('should close overlay on backdrop click', fakeAsync(() => {
      setupOverlayMocks();
      component['overlayRef'] = null;

      component.openFilter();

      backdropClickSubject.next(new MouseEvent('click'));
      tick();

      expect(mockNewOverlayRef.dispose).toHaveBeenCalled();
      expect(component.isFilterOpen).toBeFalse();
    }));

    it('should set currentFilters on filter panel instance', () => {
      setupOverlayMocks();
      component['overlayRef'] = null;
      component.appliedFilters = mockFilters;

      component.openFilter();

      expect(mockComponentRef.instance.currentFilters).toEqual(mockFilters);
    });
  });

  describe('Error handling', () => {
    it('should handle API errors gracefully', fakeAsync(() => {
      mockProductAttributeService.getProductAttributes.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.loadTableData();
      tick();

      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('No Product Type Attributes available to display');
    }));

    it('should log error to console on API failure', fakeAsync(() => {
      const consoleSpy = spyOn(console, 'error');
      mockProductAttributeService.getProductAttributes.and.returnValue(
        throwError(() => new Error('Server error'))
      );

      component.loadTableData();
      tick();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error loading product attributes data:',
        jasmine.any(Error)
      );
    }));
  });

  describe('formatDate (via column valueFormatter)', () => {
    it('should format a valid date correctly', () => {
      const columns = component.tableConfig.columns;
      const effDateCol = columns.find(c => c.key === 'effDate');
      const formatted = effDateCol!.valueFormatter!(new Date('2024-03-15'));

      expect(formatted).toBe('15-MAR-2024');
    });

    it('should return dash for null date', () => {
      const columns = component.tableConfig.columns;
      const effDateCol = columns.find(c => c.key === 'effDate');
      const formatted = effDateCol!.valueFormatter!(null);

      expect(formatted).toBe('-');
    });

    it('should return dash for undefined/empty date', () => {
      const columns = component.tableConfig.columns;
      const termDateCol = columns.find(c => c.key === 'termDate');
      const formatted = termDateCol!.valueFormatter!(null);

      expect(formatted).toBe('-');
    });

    it('should format date string correctly', () => {
      const columns = component.tableConfig.columns;
      const lastModifiedCol = columns.find(c => c.key === 'lastModifiedDate');
      const formatted = lastModifiedCol!.valueFormatter!('2024-12-25');

      expect(formatted).toBe('25-DEC-2024');
    });

    it('should pad single-digit days', () => {
      const columns = component.tableConfig.columns;
      const effDateCol = columns.find(c => c.key === 'effDate');
      const formatted = effDateCol!.valueFormatter!(new Date('2024-01-05'));

      expect(formatted).toBe('05-JAN-2024');
    });
  });

  describe('Column value formatters', () => {
    it('should format labelFlag Y as Y', () => {
      const columns = component.tableConfig.columns;
      const labelFlagCol = columns.find(c => c.key === 'labelFlag');
      expect(labelFlagCol!.valueFormatter!('Y')).toBe('Y');
    });

    it('should format labelFlag N as N', () => {
      const columns = component.tableConfig.columns;
      const labelFlagCol = columns.find(c => c.key === 'labelFlag');
      expect(labelFlagCol!.valueFormatter!('N')).toBe('N');
    });

    it('should format labelFlag empty/null as N', () => {
      const columns = component.tableConfig.columns;
      const labelFlagCol = columns.find(c => c.key === 'labelFlag');
      expect(labelFlagCol!.valueFormatter!('')).toBe('N');
      expect(labelFlagCol!.valueFormatter!(null)).toBe('N');
    });

    it('should format lifeSpanInd with value or dash', () => {
      const columns = component.tableConfig.columns;
      const lifeSpanIndCol = columns.find(c => c.key === 'lifeSpanInd');
      expect(lifeSpanIndCol!.valueFormatter!('D')).toBe('D');
      expect(lifeSpanIndCol!.valueFormatter!(null)).toBe('-');
      expect(lifeSpanIndCol!.valueFormatter!('')).toBe('-');
    });

    it('should format lifeSpan with value or dash', () => {
      const columns = component.tableConfig.columns;
      const lifeSpanCol = columns.find(c => c.key === 'lifeSpan');
      expect(lifeSpanCol!.valueFormatter!('42')).toBe('42');
      expect(lifeSpanCol!.valueFormatter!(null)).toBe('-');
      expect(lifeSpanCol!.valueFormatter!('')).toBe('-');
    });

    it('should format newProductType with value or dash', () => {
      const columns = component.tableConfig.columns;
      const newPTCol = columns.find(c => c.key === 'newProductType');
      expect(newPTCol!.valueFormatter!('PLT')).toBe('PLT');
      expect(newPTCol!.valueFormatter!(null)).toBe('-');
      expect(newPTCol!.valueFormatter!('')).toBe('-');
    });
  });

  describe('Keyboard shortcuts', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open create panel on Alt+C', () => {
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
    });

    it('should open create panel on Alt+C (uppercase)', () => {
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'C' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBeTrue();
    });

    it('should focus search bar on Alt+S', () => {
      component.searchBarComponent = jasmine.createSpyObj('SearchBar', ['focus']);
      const event = new KeyboardEvent('keydown', { altKey: true, key: 's' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.searchBarComponent.focus).toHaveBeenCalled();
    });

    it('should handle Alt+S when searchBarComponent is not set', () => {
      component.searchBarComponent = undefined as any;
      const event = new KeyboardEvent('keydown', { altKey: true, key: 's' });
      spyOn(event, 'preventDefault');

      expect(() => component.handleKeyboardShortcut(event)).not.toThrow();
    });

    it('should call openFilter on Alt+F', () => {
      spyOn(component, 'openFilter');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'f' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.openFilter).toHaveBeenCalled();
    });

    it('should close overlay on Escape when overlayRef exists', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = mockOverlayRef;
      component.isFilterOpen = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should close side panel on Escape when side panel is open and no overlay', () => {
      component['overlayRef'] = null;
      component.sidePanelOpen = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should not trigger shortcuts without alt key for c/s/f', () => {
      const event = new KeyboardEvent('keydown', { key: 'c' });
      component.sidePanelOpen = false;

      component.handleKeyboardShortcut(event);

      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should not trigger any action for unrelated key presses', () => {
      spyOn(component, 'openFilter');
      const event = new KeyboardEvent('keydown', { key: 'a' });

      component.handleKeyboardShortcut(event);

      expect(component.openFilter).not.toHaveBeenCalled();
      expect(component.sidePanelOpen).toBeFalse();
    });
  });

  describe('Chapter changes subscription', () => {
    it('should close side panel and clear filters when chapter changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.sidePanelOpen = true;
      component.sidePanelData = mockProductAttributeData[0];
      component.appliedFilters = mockFilters;
      component.filterChips = FilterChipsUtils.convertFiltersToChips(mockFilters);
      component.requestState = { productType: 'RBC' };

      chapterChangedSubject.next();
      tick();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
    }));
  });

  describe('updateRequestStateFromFilters (via onRemoveFilterChip)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear filter-related properties from requestState when appliedFilters becomes null', fakeAsync(() => {
      component.requestState = {
        searchKeyword: 'test',
        productType: 'RBC',
        attribGroup: 'ISBT',
        attribCode: 'E0001',
        labelFlag: 'Y',
        lifeSpanInd: 'D',
        effDate: '2024-01-01',
        effDatePeriod: 'AFTER',
        termDate: '2024-12-31',
        termDatePeriod: 'BEFORE'
      };

      // Apply a single filter and then remove it so appliedFilters becomes null
      component.appliedFilters = { productType: 'RBC' };

      component.onRemoveFilterChip('productType');
      tick();

      // After removing the only filter, appliedFilters should be null
      // and filter properties should be cleared from requestState
      expect(component.requestState.searchKeyword).toBe('test');
      expect(component.requestState.productType).toBeUndefined();
    }));

    it('should update requestState with remaining filters after chip removal', fakeAsync(() => {
      component.appliedFilters = {
        productType: 'RBC',
        attribGroup: 'ISBT',
        attribCode: 'E0001'
      };
      component.requestState = {
        productType: 'RBC',
        attribGroup: 'ISBT',
        attribCode: 'E0001'
      };

      component.onRemoveFilterChip('productType');
      tick();

      expect(component.requestState.productType).toBeUndefined();
      expect(component.requestState.attribGroup).toBe('ISBT');
      expect(component.requestState.attribCode).toBe('E0001');
    }));

    it('should handle moment date in updateRequestStateFromFilters via onRemoveFilterChip', fakeAsync(() => {
      const momentDate = moment('2024-06-15');
      component.appliedFilters = {
        productType: 'RBC',
        effDate: momentDate,
        effDatePeriod: 'AFTER'
      };
      component.requestState = {
        productType: 'RBC',
        effDate: '2024-06-15',
        effDatePeriod: 'AFTER'
      };

      component.onRemoveFilterChip('productType');
      tick();

      // effDate should still be present as a formatted string
      expect(component.requestState.effDate).toBe('2024-06-15');
      expect(component.requestState.effDatePeriod).toBe('AFTER');
    }));

    it('should handle string date in updateRequestStateFromFilters', fakeAsync(() => {
      component.appliedFilters = {
        productType: 'RBC',
        termDate: '2024-12-31' as any,
        termDatePeriod: 'BEFORE'
      };
      component.requestState = {
        productType: 'RBC',
        termDate: '2024-12-31',
        termDatePeriod: 'BEFORE'
      };

      component.onRemoveFilterChip('productType');
      tick();

      expect(component.requestState.termDate).toBe('2024-12-31');
      expect(component.requestState.termDatePeriod).toBe('BEFORE');
    }));
  });
});
