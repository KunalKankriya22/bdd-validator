import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { of, throwError, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { RbcAntigenProductTypeComponent } from './rbc-antigen-product-type';
import { RbcAntigenProductTypeService } from './services/rbc-antigen-product-type.service';
import { RbcAntigenProductTypeModel, RbcAntigenProductTypeFilterValue } from './models/rbc-antigen-product-type.model';
import { HeaderService } from '@shared/services/header.service';
import { provideRouter } from '@angular/router';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { RbcAntigenProductTypeFilterChipsUtils } from './utils/filter-chips.utils';

describe('RbcAntigenProductTypeComponent', () => {
  let component: RbcAntigenProductTypeComponent;
  let fixture: ComponentFixture<RbcAntigenProductTypeComponent>;
  let mockService: jasmine.SpyObj<RbcAntigenProductTypeService>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let chapterChangedSubject: Subject<void>;

  const mockData: RbcAntigenProductTypeModel[] = [
    {
      productType: 'PT001',
      effDate: '2024-01-01',
      termDate: null
    },
    {
      productType: 'PT002',
      effDate: '2024-01-15',
      termDate: '2025-12-31'
    }
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('RbcAntigenProductTypeService', [
      'getAgPrintProdTypes',
      'getProductTypeLookups',
      'createRecord',
      'updateRecord',
      'deleteRecord'
    ]);

    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position', 'scrollStrategies']);
    chapterChangedSubject = new Subject<void>();



      TestBed.configureTestingModule({
      imports: [RbcAntigenProductTypeComponent,
        TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RbcAntigenProductTypeService, useValue: mockService },
        { provide: Overlay, useValue: mockOverlay },
        { provide: HeaderService, useValue: { chapterChanged$: chapterChangedSubject.asObservable() } }
      ]
    });




      mockService.getAgPrintProdTypes.calls.reset();


      mockService.getProductTypeLookups.calls.reset();


      mockService.createRecord.calls.reset();


      mockService.updateRecord.calls.reset();


      mockService.deleteRecord.calls.reset();


      mockOverlay.create.calls.reset();


      mockOverlay.position.calls.reset();


      mockOverlay.scrollStrategies.calls.reset();


    fixture = TestBed.createComponent(RbcAntigenProductTypeComponent);
    component = fixture.componentInstance;


    });


  describe('Component Initialization', () => {
    it('should initialize with correct configuration', () => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: [], total: 0 })
      );

      fixture.detectChanges();

      expect(component.searchConfig.placeholder).toContain('Product Type');
      expect(component.tableConfig.columns.length).toBeGreaterThan(0);
    });

    it('should create the component', () => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize with default state values', () => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();

      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(false);
      expect(component.errorMessage).toBe('');
      expect(component.searchText).toBe('');
      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.isFilterOpen).toBe(false);
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
    });

    it('should set search config with correct values', () => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();

      expect(component.searchConfig.placeholder).toBe('Search by Product Type');
      expect(component.searchConfig.minLength).toBe(2);
      expect(component.searchConfig.ariaLabel).toBe('Search RBC antigen product types');
      expect(component.searchConfig.alwaysShowTooltip).toBe(true);
    });

    it('should set table config with correct columns', () => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();

      expect(component.tableConfig.columns.length).toBe(3);
      expect(component.tableConfig.columns[0].key).toBe('productType');
      expect(component.tableConfig.columns[0].sortable).toBe(true);
      expect(component.tableConfig.columns[1].key).toBe('effDate');
      expect(component.tableConfig.columns[2].key).toBe('termDate');
    });

    it('should set table config with correct row actions', () => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();

      expect(component.tableConfig.rowActions!.length).toBe(1);
      expect(component.tableConfig.rowActions![0].action).toBe('edit');
      expect(component.tableConfig.rowActions![0].icon).toBe('edit');
    });

    it('should set table config with correct sort and display settings', () => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();

      expect(component.tableConfig.sortConfig!.column).toBe('productType');
      expect(component.tableConfig.sortConfig!.direction).toBe('default');
      expect(component.tableConfig.stickyHeader).toBe(true);
      expect(component.tableConfig.stickyActionsColumn).toBe(true);
      expect(component.tableConfig.emptyMessage).toContain('No RBC antigen product type');
      expect(component.tableConfig.loadingMessage).toContain('Loading');
      expect(component.tableConfig.showPagination).toBe(false);
    });

    it('should call loadData on init', () => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: mockData, total: 2 })
      );
      fixture.detectChanges();

      expect(mockService.getAgPrintProdTypes).toHaveBeenCalledWith({});
    });
  });

  describe('loadData', () => {
    it('should set isLoading to true while loading', () => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: [], total: 0 })
      );

      component.loadData();
      // isLoading is set to true synchronously before the observable resolves
      // but with `of()` it resolves synchronously too, so after the call it's false
      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(false);
    });

    it('should populate allData and dataSource on success', () => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: mockData, total: 2 })
      );
      fixture.detectChanges();

      expect(component.dataSource).toEqual(mockData);
      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(false);
    });

    it('should handle empty data', () => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();

      expect(component.dataSource).toEqual([]);
      expect(component.isLoading).toBe(false);
    });

    it('should handle error from service', () => {
      const consoleSpy = spyOn(console, 'error');
      mockService.getAgPrintProdTypes.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();

      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Failed to load RBC antigen product type data. Please try again.');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should pass requestBody to the service', () => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: [], total: 0 })
      );
      component.requestBody = { searchKeyword: 'test', sort: 'A' };
      component.loadData();

      expect(mockService.getAgPrintProdTypes).toHaveBeenCalledWith({ searchKeyword: 'test', sort: 'A' });
    });
  });

  describe('Filter Functionality', () => {
    beforeEach(() => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should apply date filters', () => {
      const filters: RbcAntigenProductTypeFilterValue = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.appliedFilters).toBe(filters);
    });



    it('should check for active filters', () => {
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should apply filters with effective date "before"', () => {
      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.returnValue('2024-01-01');
      const filters: RbcAntigenProductTypeFilterValue = {
        effectiveDatePeriod: 'before',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestBody.effDateBefore).toBe('2024-01-01');
      expect(component.requestBody.effDateAfter).toBeUndefined();
    });

    it('should apply filters with effective date "after"', () => {
      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.returnValue('2024-06-15');
      const filters: RbcAntigenProductTypeFilterValue = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-06-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestBody.effDateAfter).toBe('2024-06-15');
      expect(component.requestBody.effDateBefore).toBeUndefined();
    });

    it('should apply filters with termination date "after"', () => {
      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.returnValue('2025-12-31');
      const filters: RbcAntigenProductTypeFilterValue = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'after',
        terminationDate: new Date('2025-12-31')
      };

      component.applyFilters(filters);

      expect(component.requestBody.termDateAfter).toBe('2025-12-31');
      expect(component.requestBody.termDateBefore).toBeUndefined();
    });

    it('should apply filters with termination date "before"', () => {
      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.returnValue('2025-06-01');
      const filters: RbcAntigenProductTypeFilterValue = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: new Date('2025-06-01')
      };

      component.applyFilters(filters);

      expect(component.requestBody.termDateBefore).toBe('2025-06-01');
      expect(component.requestBody.termDateAfter).toBeUndefined();
    });

    it('should apply filters with both effective and termination dates', () => {
      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.returnValue('2024-01-01');
      const filters: RbcAntigenProductTypeFilterValue = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: 'before',
        terminationDate: new Date('2024-01-01')
      };

      component.applyFilters(filters);

      expect(component.requestBody.effDateAfter).toBe('2024-01-01');
      expect(component.requestBody.termDateBefore).toBe('2024-01-01');
    });

    it('should set undefined for date fields when serializeDateForApi returns null', () => {
      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.returnValue(null as any);
      const filters: RbcAntigenProductTypeFilterValue = {
        effectiveDatePeriod: 'after',
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestBody.effDateAfter).toBeUndefined();
      expect(component.requestBody.termDateBefore).toBeUndefined();
    });

    it('should call loadData after applying filters', () => {
      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.returnValue('2024-01-01');
      const filters: RbcAntigenProductTypeFilterValue = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      mockService.getAgPrintProdTypes.calls.reset();
      component.applyFilters(filters);
      expect(mockService.getAgPrintProdTypes).toHaveBeenCalled();
    });

    it('should generate filter chips when applying filters', () => {
      spyOn(RbcAntigenProductTypeFilterChipsUtils, 'convertFiltersToChips').and.returnValue([
        { key: 'effectiveDate', label: 'Effective Date >= 01-JAN-2024', value: '01-JAN-2024' }
      ]);
      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.returnValue('2024-01-01');

      const filters: RbcAntigenProductTypeFilterValue = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.filterChips.length).toBe(1);
      expect(component.filterChips[0].key).toBe('effectiveDate');
    });

    it('should remove a filter chip and reload data', () => {
      spyOn(RbcAntigenProductTypeFilterChipsUtils, 'removeFilterByChipKey').and.returnValue(null);
      spyOn(RbcAntigenProductTypeFilterChipsUtils, 'convertFiltersToChips').and.returnValue([]);

      const originalFilters: RbcAntigenProductTypeFilterValue = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.appliedFilters = originalFilters;

      mockService.getAgPrintProdTypes.calls.reset();
      component.onRemoveFilterChip('effectiveDate');

      expect(RbcAntigenProductTypeFilterChipsUtils.removeFilterByChipKey).toHaveBeenCalledWith(
        originalFilters,
        'effectiveDate'
      );
      expect(mockService.getAgPrintProdTypes).toHaveBeenCalled();
    });

    it('should clear all filters and reload data', () => {
      component.appliedFilters = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.filterChips = [{ key: 'effectiveDate', label: 'test', value: 'test' }];
      component.requestBody = { searchKeyword: 'test', sort: 'A', effDateAfter: '2024-01-01' };

      mockService.getAgPrintProdTypes.calls.reset();
      component.clearAllFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.requestBody.searchKeyword).toBe('test');
      expect(component.requestBody.sort).toBe('A');
      expect(component.requestBody.effDateAfter).toBeUndefined();
      expect(mockService.getAgPrintProdTypes).toHaveBeenCalled();
    });

    it('should return true when active filters exist', () => {
      spyOn(RbcAntigenProductTypeFilterChipsUtils, 'hasActiveFilters').and.returnValue(true);
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should return false when no active filters', () => {
      spyOn(RbcAntigenProductTypeFilterChipsUtils, 'hasActiveFilters').and.returnValue(false);
      expect(component.hasActiveFilters()).toBe(false);
    });
  });

  describe('updateRequestBodyFromFilters (via onRemoveFilterChip)', () => {
    beforeEach(() => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should clear filter fields from requestBody when appliedFilters becomes null', () => {
      component.requestBody = { searchKeyword: 'hello', sort: 'D', effDateAfter: '2024-01-01' };

      spyOn(RbcAntigenProductTypeFilterChipsUtils, 'removeFilterByChipKey').and.returnValue(null);
      spyOn(RbcAntigenProductTypeFilterChipsUtils, 'convertFiltersToChips').and.returnValue([]);

      component.onRemoveFilterChip('effectiveDate');

      expect(component.requestBody.searchKeyword).toBe('hello');
      expect(component.requestBody.sort).toBe('D');
      expect(component.requestBody.effDateAfter).toBeUndefined();
    });

    it('should rebuild requestBody from remaining filters when some filters remain', () => {
      const remainingFilters: RbcAntigenProductTypeFilterValue = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'after',
        terminationDate: new Date('2025-06-01')
      };

      spyOn(RbcAntigenProductTypeFilterChipsUtils, 'removeFilterByChipKey').and.returnValue(remainingFilters);
      spyOn(RbcAntigenProductTypeFilterChipsUtils, 'convertFiltersToChips').and.returnValue([
        { key: 'terminationDate', label: 'test', value: 'test' }
      ]);
      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.callFake((date: any) => {
        if (date) return '2025-06-01';
        return null as any;
      });

      component.requestBody = { searchKeyword: 'x', sort: 'A' };
      component.appliedFilters = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: 'after',
        terminationDate: new Date('2025-06-01')
      };

      component.onRemoveFilterChip('effectiveDate');

      expect(component.requestBody.termDateAfter).toBe('2025-06-01');
      expect(component.requestBody.effDateAfter).toBeUndefined();
    });
  });

  describe('CRUD Operations', () => {
    beforeEach(() => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: mockData, total: 2 })
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
      component.editRecord(mockData[0]);

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockData[0]);
      expect(component.sidePanelOpen).toBe(true);
    });

    it('should close side panel', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockData[0];

      component.closeSidePanel();

      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });

    it('should reload data on save success', () => {
      mockService.getAgPrintProdTypes.calls.reset();
      component.onSaveSuccess();

      expect(mockService.getAgPrintProdTypes).toHaveBeenCalled();
    });
  });

  describe('onModeChange', () => {
    beforeEach(() => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: mockData, total: 2 })
      );
      fixture.detectChanges();
    });

    it('should switch to add mode and clear sidePanelData', () => {
      component.sidePanelData = mockData[0];
      component.sidePanelMode = 'edit';

      component.onModeChange('add');

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should switch to edit mode and keep sidePanelData', () => {
      component.sidePanelData = mockData[0];
      component.sidePanelMode = 'add';

      component.onModeChange('edit');

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockData[0]);
    });
  });

  describe('onRowAction', () => {
    beforeEach(() => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: mockData, total: 2 })
      );
      fixture.detectChanges();
    });

    it('should call editRecord when action is "edit"', () => {
      spyOn(component, 'editRecord');
      component.onRowAction({ action: 'edit', row: mockData[0] });

      expect(component.editRecord).toHaveBeenCalledWith(mockData[0]);
    });

    it('should not throw for unknown action', () => {
      expect(() => {
        component.onRowAction({ action: 'unknown', row: mockData[0] });
      }).not.toThrow();
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should clear searchKeyword and reload when search text is empty', () => {
      component.requestBody.searchKeyword = 'previous';
      mockService.getAgPrintProdTypes.calls.reset();

      component.onSearchEvent('');

      expect(component.requestBody.searchKeyword).toBeUndefined();
      expect(mockService.getAgPrintProdTypes).toHaveBeenCalled();
    });

    it('should clear searchKeyword and reload when search text is whitespace only', () => {
      component.requestBody.searchKeyword = 'previous';
      mockService.getAgPrintProdTypes.calls.reset();

      component.onSearchEvent('   ');

      expect(component.requestBody.searchKeyword).toBeUndefined();
      expect(mockService.getAgPrintProdTypes).toHaveBeenCalled();
    });

    it('should not reload when search text is non-empty', () => {
      mockService.getAgPrintProdTypes.calls.reset();

      component.onSearchEvent('test');

      expect(mockService.getAgPrintProdTypes).not.toHaveBeenCalled();
    });

    it('should handle null search text', () => {
      mockService.getAgPrintProdTypes.calls.reset();
      component.requestBody.searchKeyword = 'old';

      component.onSearchEvent(null as any);

      expect(component.requestBody.searchKeyword).toBeUndefined();
      expect(mockService.getAgPrintProdTypes).toHaveBeenCalled();
    });

    it('should set searchKeyword and load data on enter search when text >= 2 chars', () => {
      component.searchBarComponent = { searchText: 'PT0', focus: () => {}, clearSearch: () => {} } as any;
      mockService.getAgPrintProdTypes.calls.reset();

      component.onEnterSearch();

      expect(component.requestBody.searchKeyword).toBe('PT0');
      expect(mockService.getAgPrintProdTypes).toHaveBeenCalled();
    });

    it('should not load data on enter search when text < 2 chars', () => {
      component.searchBarComponent = { searchText: 'P', focus: () => {}, clearSearch: () => {} } as any;
      mockService.getAgPrintProdTypes.calls.reset();

      component.onEnterSearch();

      expect(mockService.getAgPrintProdTypes).not.toHaveBeenCalled();
    });

    it('should handle missing searchBarComponent in onEnterSearch', () => {
      (component as any).searchBarComponent = undefined;
      mockService.getAgPrintProdTypes.calls.reset();

      component.onEnterSearch();

      expect(mockService.getAgPrintProdTypes).not.toHaveBeenCalled();
    });

    it('should trim whitespace from search text in onEnterSearch', () => {
      component.searchBarComponent = { searchText: '  PT  ', focus: () => {}, clearSearch: () => {} } as any;
      mockService.getAgPrintProdTypes.calls.reset();

      component.onEnterSearch();

      expect(component.requestBody.searchKeyword).toBe('PT');
      expect(mockService.getAgPrintProdTypes).toHaveBeenCalled();
    });
  });

  describe('Sort Functionality', () => {
    beforeEach(() => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should set sort to "A" for ascending', () => {
      mockService.getAgPrintProdTypes.calls.reset();

      component.onSortChange({ column: 'productType', direction: 'A' as any });

      expect(component.requestBody.sort).toBe('A');
      expect(component.tableConfig.sortConfig!.column).toBe('productType');
      expect(component.tableConfig.sortConfig!.direction).toBe('A');
      expect(mockService.getAgPrintProdTypes).toHaveBeenCalled();
    });

    it('should set sort to "D" for descending', () => {
      mockService.getAgPrintProdTypes.calls.reset();

      component.onSortChange({ column: 'productType', direction: 'D' as any });

      expect(component.requestBody.sort).toBe('D');
      expect(mockService.getAgPrintProdTypes).toHaveBeenCalled();
    });

    it('should clear sort for default direction', () => {
      component.requestBody.sort = 'A';
      mockService.getAgPrintProdTypes.calls.reset();

      component.onSortChange({ column: 'productType', direction: 'default' });

      expect(component.requestBody.sort).toBeUndefined();
      expect(mockService.getAgPrintProdTypes).toHaveBeenCalled();
    });
  });

  describe('Format Helpers', () => {
    beforeEach(() => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should format a valid date string', () => {
      const formatted = component['formatDate']('2024-01-15');
      expect(formatted).toBe('15-JAN-2024');
    });

    it('should return "-" for null date', () => {
      const formatted = component['formatDate'](null);
      expect(formatted).toBe('-');
    });

    it('should return "-" for undefined date', () => {
      const formatted = component['formatDate'](undefined);
      expect(formatted).toBe('-');
    });

    it('should return "-" for empty string date', () => {
      const formatted = component['formatDate']('');
      expect(formatted).toBe('-');
    });

    it('should format UTC date near midnight without timezone shift', () => {
      const formatted = component['formatDate']('2026-04-19T23:00:00Z');
      expect(formatted).toBe('19-APR-2026');
    });

    it('should format date for each month correctly', () => {
      expect(component['formatDate']('2024-02-01')).toBe('01-FEB-2024');
      expect(component['formatDate']('2024-03-15')).toBe('15-MAR-2024');
      expect(component['formatDate']('2024-12-25')).toBe('25-DEC-2024');
    });
  });

  describe('Filter Panel (openFilter)', () => {
    beforeEach(() => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should close existing overlay if already open', () => {
      const mockOverlayRef = jasmine.createSpyObj<OverlayRef>('OverlayRef', ['dispose', 'attach', 'backdropClick']);
      (component as any).overlayRef = mockOverlayRef;
      component.isFilterOpen = true;

      component.openFilter();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect((component as any).overlayRef).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });
  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(() => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should call createRecord on Alt+C', () => {
      spyOn(component, 'createRecord');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.createRecord).toHaveBeenCalled();
    });

    it('should call createRecord on Alt+C (uppercase)', () => {
      spyOn(component, 'createRecord');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'C' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(component.createRecord).toHaveBeenCalled();
    });

    it('should focus search bar on Alt+S', () => {
      const mockFocus = jasmine.createSpy('focus');
      component.searchBarComponent = { focus: mockFocus, searchText: '', clearSearch: () => {} } as any;
      const event = new KeyboardEvent('keydown', { altKey: true, key: 's' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockFocus).toHaveBeenCalled();
    });

    it('should call openFilter on Alt+F', () => {
      spyOn(component, 'openFilter');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'f' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.openFilter).toHaveBeenCalled();
    });

    it('should close filter overlay on Escape when overlay is open', () => {
      const mockOverlayRef = jasmine.createSpyObj<OverlayRef>('OverlayRef', ['dispose', 'attach', 'backdropClick']);
      (component as any).overlayRef = mockOverlayRef;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect((component as any).overlayRef).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should close side panel on Escape when side panel is open and no overlay', () => {
      (component as any).overlayRef = null;
      component.sidePanelOpen = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBe(false);
    });

    it('should not do anything for non-shortcut keys', () => {
      spyOn(component, 'createRecord');
      spyOn(component, 'openFilter');
      const event = new KeyboardEvent('keydown', { key: 'a' });

      component.handleKeyboardShortcut(event);

      expect(component.createRecord).not.toHaveBeenCalled();
      expect(component.openFilter).not.toHaveBeenCalled();
    });

    it('should not trigger shortcuts without Alt key (except Escape)', () => {
      spyOn(component, 'createRecord');
      const event = new KeyboardEvent('keydown', { key: 'c' });

      component.handleKeyboardShortcut(event);

      expect(component.createRecord).not.toHaveBeenCalled();
    });

    it('should handle Escape when both overlay and side panel are open', () => {
      const mockOverlayRef = jasmine.createSpyObj<OverlayRef>('OverlayRef', ['dispose', 'attach', 'backdropClick']);
      (component as any).overlayRef = mockOverlayRef;
      component.sidePanelOpen = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      // Overlay is closed first, then side panel is also closed (both if blocks run)
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
    });

    it('should handle Alt+S when searchBarComponent is undefined', () => {
      (component as any).searchBarComponent = undefined;
      const event = new KeyboardEvent('keydown', { altKey: true, key: 's' });
      spyOn(event, 'preventDefault');

      expect(() => component.handleKeyboardShortcut(event)).not.toThrow();
    });
  });

  describe('Chapter Change Subscription', () => {
    beforeEach(() => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: mockData, total: 2 })
      );
      fixture.detectChanges();
    });

    it('should reset state and reload data on chapter change', () => {
      // Set up some state
      component.sidePanelOpen = true;
      component.appliedFilters = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date(),
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.filterChips = [{ key: 'effectiveDate', label: 'test', value: 'test' }];
      component.searchText = 'search text';
      component.requestBody = { searchKeyword: 'old', sort: 'A' };

      mockService.getAgPrintProdTypes.calls.reset();

      chapterChangedSubject.next();

      expect(component.sidePanelOpen).toBe(false);
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.searchText).toBe('');
      expect(component.requestBody).toEqual({});
      expect(mockService.getAgPrintProdTypes).toHaveBeenCalled();
    });

    it('should reset sort config direction to default on chapter change', () => {
      component.tableConfig.sortConfig!.direction = 'A' as any;

      chapterChangedSubject.next();

      expect(component.tableConfig.sortConfig!.direction).toBe('default');
    });

    it('should call clearSearch on searchBarComponent if available', () => {
      const mockClearSearch = jasmine.createSpy('clearSearch');
      component.searchBarComponent = { clearSearch: mockClearSearch, searchText: '', focus: () => {} } as any;

      chapterChangedSubject.next();

      expect(mockClearSearch).toHaveBeenCalled();
    });

    it('should handle chapter change when searchBarComponent is not available', () => {
      (component as any).searchBarComponent = undefined;

      expect(() => chapterChangedSubject.next()).not.toThrow();
    });

    it('should dispose overlay on chapter change if open', () => {
      const mockOverlayRef = jasmine.createSpyObj<OverlayRef>('OverlayRef', ['dispose', 'attach', 'backdropClick']);
      (component as any).overlayRef = mockOverlayRef;
      component.isFilterOpen = true;

      chapterChangedSubject.next();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect((component as any).overlayRef).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should not fail when sortConfig is null on chapter change', () => {
      component.tableConfig.sortConfig = undefined as any;

      expect(() => chapterChangedSubject.next()).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should complete the destroy$ subject', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should dispose overlayRef if it exists', () => {
      const mockOverlayRef = jasmine.createSpyObj<OverlayRef>('OverlayRef', ['dispose', 'attach', 'backdropClick']);
      (component as any).overlayRef = mockOverlayRef;

      component.ngOnDestroy();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
    });

    it('should not throw when overlayRef is null', () => {
      (component as any).overlayRef = null;

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('Table column valueFormatters', () => {
    beforeEach(() => {
      mockService.getAgPrintProdTypes.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should have valueFormatter on effDate column that formats dates', () => {
      const effDateCol = component.tableConfig.columns.find(c => c.key === 'effDate');
      expect(effDateCol).toBeTruthy();
      expect(effDateCol!.valueFormatter).toBeDefined();
      expect(effDateCol!.valueFormatter!('2024-05-10')).toBe('10-MAY-2024');
      expect(effDateCol!.valueFormatter!(null)).toBe('-');
    });

    it('should have valueFormatter on termDate column that formats dates', () => {
      const termDateCol = component.tableConfig.columns.find(c => c.key === 'termDate');
      expect(termDateCol).toBeTruthy();
      expect(termDateCol!.valueFormatter).toBeDefined();
      expect(termDateCol!.valueFormatter!('2025-12-31')).toBe('31-DEC-2025');
      expect(termDateCol!.valueFormatter!(null)).toBe('-');
    });
  });
});
