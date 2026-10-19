import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { of, throwError, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { ProductTypePrioritizationComponent } from './product-type-prioritization';
import { ProductTypePrioritizationService } from './services/product-type-prioritization.service';
import { ProductTypePrioritizationModel } from './models/product-type-prioritization.model';
import { HeaderService } from '@shared/services/header.service';
import { LabelingFilterDataService } from '../services/labeling-filter-data.service';
import { provideRouter } from '@angular/router';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

describe('ProductTypePrioritizationComponent', () => {
  let component: ProductTypePrioritizationComponent;
  let fixture: ComponentFixture<ProductTypePrioritizationComponent>;
  let mockService: jasmine.SpyObj<ProductTypePrioritizationService>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let chapterChangedSubject: Subject<void>;
  let filterDataService: LabelingFilterDataService;

  const mockData: ProductTypePrioritizationModel[] = [
    {
      productType: 'PT001',
      barcodeValue: 'BC001',
      prioritySeq: 1,
      effDate: '2024-01-01',
      termDate: null
    },
    {
      productType: 'PT002',
      barcodeValue: 'BC002',
      prioritySeq: 2,
      effDate: '2024-01-15',
      termDate: '2025-12-31'
    }
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('ProductTypePrioritizationService', [
      'getProductTypePrioritizations',
      'getProductTypeLookups',
      'getBarcodeLookups',
      'getMaxPriority',
      'checkPriorityConflict',
      'createProductTypePrioritization',
      'updateProductTypePrioritization'
    ]);

    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position', 'scrollStrategies']);
    chapterChangedSubject = new Subject<void>();



      TestBed.configureTestingModule({
imports: [ProductTypePrioritizationComponent,
        TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProductTypePrioritizationService, useValue: mockService },
        { provide: Overlay, useValue: mockOverlay },
        { provide: HeaderService, useValue: { chapterChanged$: chapterChangedSubject.asObservable() } },
        LabelingFilterDataService
      ]
    });

    filterDataService = TestBed.inject(LabelingFilterDataService);

    });



  beforeEach(() => {


      mockService.getProductTypePrioritizations.calls.reset();


      mockService.getProductTypeLookups.calls.reset();


      mockService.getBarcodeLookups.calls.reset();


      mockService.getMaxPriority.calls.reset();


      mockService.checkPriorityConflict.calls.reset();


      mockService.createProductTypePrioritization.calls.reset();


      mockService.updateProductTypePrioritization.calls.reset();


      mockOverlay.create.calls.reset();


      mockOverlay.position.calls.reset();


      mockOverlay.scrollStrategies.calls.reset();


    fixture = TestBed.createComponent(ProductTypePrioritizationComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {
    it('should initialize with correct configuration', () => {
      mockService.getProductTypePrioritizations.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      fixture.detectChanges();

      expect(component.searchConfig.placeholder).toContain('Search');
      expect(component.tableConfig.columns.length).toBeGreaterThan(0);
    });


  });
  describe('Search Functionality', () => {
    it('should clear search and reload when search text is empty', () => {
      mockService.getProductTypePrioritizations.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      fixture.detectChanges();

      component.onSearchEvent('');

      expect(component.requestState.searchKeyword).toBeUndefined();
      expect(mockService.getProductTypePrioritizations).toHaveBeenCalled();
    });

    it('should not reload when search text is non-empty', () => {
      mockService.getProductTypePrioritizations.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
      mockService.getProductTypePrioritizations.calls.reset();

      component.onSearchEvent('ab');

      expect(mockService.getProductTypePrioritizations).not.toHaveBeenCalled();
    });

    it('should clear search keyword and reload when whitespace-only text is passed', () => {
      mockService.getProductTypePrioritizations.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
      component.requestState.searchKeyword = 'old';
      mockService.getProductTypePrioritizations.calls.reset();

      component.onSearchEvent('   ');

      expect(component.requestState.searchKeyword).toBeUndefined();
      expect(mockService.getProductTypePrioritizations).toHaveBeenCalled();
    });

    it('should set searchKeyword and load data via onEnterSearch when text >= 3 chars', () => {
      mockService.getProductTypePrioritizations.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
      mockService.getProductTypePrioritizations.calls.reset();

      component.searchBarComponent = { searchText: 'PT001', focus: jasmine.createSpy(), clearSearch: jasmine.createSpy() } as any;
      component.onEnterSearch();

      expect(component.requestState.searchKeyword).toBe('PT001');
      expect(mockService.getProductTypePrioritizations).toHaveBeenCalled();
    });

    it('should not set searchKeyword via onEnterSearch when text < 3 chars', () => {
      mockService.getProductTypePrioritizations.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
      mockService.getProductTypePrioritizations.calls.reset();

      component.searchBarComponent = { searchText: 'PT', focus: jasmine.createSpy(), clearSearch: jasmine.createSpy() } as any;
      component.onEnterSearch();

      expect(component.requestState.searchKeyword).toBeUndefined();
      expect(mockService.getProductTypePrioritizations).not.toHaveBeenCalled();
    });

    it('should handle onEnterSearch when searchBarComponent is undefined', () => {
      mockService.getProductTypePrioritizations.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
      mockService.getProductTypePrioritizations.calls.reset();

      (component as any).searchBarComponent = undefined;
      component.onEnterSearch();

      expect(mockService.getProductTypePrioritizations).not.toHaveBeenCalled();
    });
  });
  describe('Filter Functionality', () => {
    beforeEach(() => {
      mockService.getProductTypePrioritizations.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
    });

    it('should apply product type filter', () => {
      const filters = {
        productType: 'PT001',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.appliedFilters).toBe(filters);
    });

    it('should apply date filters with "after" period for effective date', () => {
      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.returnValue('2024-06-01');
      mockService.getProductTypePrioritizations.calls.reset();

      const filters = {
        productType: null,
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-06-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestState.effDateAfter).toBe('2024-06-01');
      expect(component.requestState.effDateBefore).toBeUndefined();
      expect(mockService.getProductTypePrioritizations).toHaveBeenCalled();
    });

    it('should apply date filters with "before" period for termination date', () => {
      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.returnValue('2025-12-31');
      mockService.getProductTypePrioritizations.calls.reset();

      const filters = {
        productType: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: new Date('2025-12-31')
      };

      component.applyFilters(filters);

      expect(component.requestState.termDateBefore).toBe('2025-12-31');
      expect(component.requestState.termDateAfter).toBeUndefined();
      expect(mockService.getProductTypePrioritizations).toHaveBeenCalled();
    });

    it('should not set date filter when date is null', () => {
      mockService.getProductTypePrioritizations.calls.reset();

      const filters = {
        productType: null,
        effectiveDatePeriod: 'after',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestState.effDateAfter).toBeUndefined();
      expect(component.requestState.effDateBefore).toBeUndefined();
    });

    it('should remove filter chip and reload data', () => {
      const filters = {
        productType: 'PT001',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.appliedFilters = filters;
      component.requestState = { productType: 'PT001' };
      mockService.getProductTypePrioritizations.calls.reset();

      component.onRemoveFilterChip('productType');

      expect(mockService.getProductTypePrioritizations).toHaveBeenCalled();
    });

    it('should return true for hasActiveFilters when filters are applied', () => {
      component.appliedFilters = {
        productType: 'PT001',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should return false for hasActiveFilters when no filters are applied', () => {
      component.appliedFilters = null;
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should clear all filters and reload data', () => {
      component.appliedFilters = {
        productType: 'PT001',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.filterChips = [{ key: 'productType', label: 'Product Type: PT001', value: 'PT001' }];
      component.requestState = { productType: 'PT001', searchKeyword: 'test' };
      mockService.getProductTypePrioritizations.calls.reset();

      component.clearAllFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.requestState.productType).toBeUndefined();
      expect(component.requestState.searchKeyword).toBe('test');
      expect(mockService.getProductTypePrioritizations).toHaveBeenCalled();
    });

    it('should clear date filter keys from requestState when clearing all filters', () => {
      component.requestState = {
        productType: 'PT001',
        effDateAfter: '2024-01-01',
        effDateBefore: '2024-12-31',
        termDateAfter: '2024-01-01',
        termDateBefore: '2024-12-31',
        searchKeyword: 'test'
      };
      component.appliedFilters = {
        productType: 'PT001',
        effectiveDatePeriod: 'after',
        effectiveDate: new Date(),
        terminationDatePeriod: 'before',
        terminationDate: new Date()
      };
      mockService.getProductTypePrioritizations.calls.reset();

      component.clearAllFilters();

      expect(component.requestState.effDateAfter).toBeUndefined();
      expect(component.requestState.effDateBefore).toBeUndefined();
      expect(component.requestState.termDateAfter).toBeUndefined();
      expect(component.requestState.termDateBefore).toBeUndefined();
      expect(component.requestState.searchKeyword).toBe('test');
    });

  });

  describe('CRUD Operations', () => {
    beforeEach(() => {
      mockService.getProductTypePrioritizations.and.returnValue(
        of({ data: mockData, totalRecords: 2 })
      );
      fixture.detectChanges();
    });


    it('should edit record', () => {
      component.editRecord(mockData[0]);

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockData[0]);
      expect(component.sidePanelOpen).toBe(true);
    });

    it('should create record', () => {
      component.createRecord();

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelOpen).toBe(true);
    });

    it('should close side panel', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockData[0];

      component.closeSidePanel();

      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });

    it('should handle onSaveSuccess by clearing filter data and reloading', () => {
      spyOn(filterDataService, 'clearData');
      mockService.getProductTypePrioritizations.calls.reset();

      component.onSaveSuccess();

      expect(filterDataService.clearData).toHaveBeenCalledWith('product-type-prioritization');
      expect(mockService.getProductTypePrioritizations).toHaveBeenCalled();
    });

    it('should handle onModeChange to add mode', () => {
      component.sidePanelData = mockData[0];
      component.sidePanelMode = 'edit';

      component.onModeChange('add');

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should handle onModeChange to edit mode', () => {
      component.sidePanelData = mockData[0];

      component.onModeChange('edit');

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockData[0]);
    });

    it('should handle onRowAction with edit action', () => {
      spyOn(component, 'editRecord');

      component.onRowAction({ action: 'edit', row: mockData[0] });

      expect(component.editRecord).toHaveBeenCalledWith(mockData[0]);
    });

    it('should not call editRecord for unknown row action', () => {
      spyOn(component, 'editRecord');

      component.onRowAction({ action: 'unknown', row: mockData[0] });

      expect(component.editRecord).not.toHaveBeenCalled();
    });

  });
  describe('Format Helpers', () => {
    beforeEach(() => {
      mockService.getProductTypePrioritizations.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
    });


    it('should format UTC date near midnight without timezone shift', () => {
      const formatted = component['formatDate']('2026-04-19T23:00:00Z');
      expect(formatted).toBe('19-APR-2026');
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

    it('should format a standard date string', () => {
      const formatted = component['formatDate']('2024-01-15');
      expect(formatted).toBe('15-JAN-2024');
    });

    it('should format a date at end of year', () => {
      const formatted = component['formatDate']('2025-12-31');
      expect(formatted).toBe('31-DEC-2025');
    });
  });

  describe('Load Data', () => {
    it('should load data successfully and set dataSource', () => {
      mockService.getProductTypePrioritizations.and.returnValue(
        of({ data: mockData, totalRecords: 2 })
      );
      fixture.detectChanges();

      expect(component.dataSource).toEqual(mockData);
      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(false);
    });

    it('should set filter data service when data is empty initially', () => {
      spyOn(filterDataService, 'getData').and.returnValue([]);
      spyOn(filterDataService, 'setData');
      mockService.getProductTypePrioritizations.and.returnValue(
        of({ data: mockData, totalRecords: 2 })
      );

      fixture.detectChanges();

      expect(filterDataService.setData).toHaveBeenCalledWith('product-type-prioritization', mockData);
    });

    it('should not set filter data service when data already exists', () => {
      spyOn(filterDataService, 'getData').and.returnValue(mockData);
      spyOn(filterDataService, 'setData');
      mockService.getProductTypePrioritizations.and.returnValue(
        of({ data: mockData, totalRecords: 2 })
      );

      fixture.detectChanges();

      expect(filterDataService.setData).not.toHaveBeenCalled();
    });

    it('should handle error when loading data', () => {
      spyOn(console, 'error');
      mockService.getProductTypePrioritizations.and.returnValue(
        throwError(() => new Error('Server error'))
      );

      fixture.detectChanges();

      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toContain('Failed to load');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Sort Functionality', () => {
    beforeEach(() => {
      mockService.getProductTypePrioritizations.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
      mockService.getProductTypePrioritizations.calls.reset();
    });

    it('should set sort to ascending and reload', () => {
      component.onSortChange({ column: 'productType', direction: 'A' });

      expect(component.requestState.sort).toBe('A');
      expect(component.tableConfig.sortConfig!.column).toBe('productType');
      expect(component.tableConfig.sortConfig!.direction).toBe('A');
      expect(mockService.getProductTypePrioritizations).toHaveBeenCalled();
    });

    it('should set sort to descending and reload', () => {
      component.onSortChange({ column: 'productType', direction: 'D' });

      expect(component.requestState.sort).toBe('D');
      expect(mockService.getProductTypePrioritizations).toHaveBeenCalled();
    });

    it('should clear sort when direction is default', () => {
      component.requestState.sort = 'A';

      component.onSortChange({ column: 'productType', direction: 'default' });

      expect(component.requestState.sort).toBeUndefined();
      expect(mockService.getProductTypePrioritizations).toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(() => {
      mockService.getProductTypePrioritizations.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
    });

    it('should create record on Alt+C', () => {
      spyOn(component, 'createRecord');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.createRecord).toHaveBeenCalled();
    });

    it('should focus search on Alt+S', () => {
      component.searchBarComponent = { focus: jasmine.createSpy(), searchText: '', clearSearch: jasmine.createSpy() } as any;
      const event = new KeyboardEvent('keydown', { altKey: true, key: 's' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.searchBarComponent.focus).toHaveBeenCalled();
    });

    it('should open filter on Alt+F', () => {
      spyOn(component, 'openFilter');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'f' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.openFilter).toHaveBeenCalled();
    });

    it('should close filter overlay on Escape when overlay exists', () => {
      (component as any).overlayRef = { dispose: jasmine.createSpy() };
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect((component as any).overlayRef).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should close side panel on Escape when side panel is open and no overlay', () => {
      component.sidePanelOpen = true;
      (component as any).overlayRef = null;
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBe(false);
    });

    it('should not do anything for unrelated keys', () => {
      spyOn(component, 'createRecord');
      spyOn(component, 'openFilter');
      const event = new KeyboardEvent('keydown', { key: 'x' });

      component.handleKeyboardShortcut(event);

      expect(component.createRecord).not.toHaveBeenCalled();
      expect(component.openFilter).not.toHaveBeenCalled();
    });
  });

  describe('Lifecycle', () => {
    beforeEach(() => {
      mockService.getProductTypePrioritizations.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
    });

    it('should dispose overlay on destroy if it exists', () => {
      const mockOverlayRef = { dispose: jasmine.createSpy() };
      (component as any).overlayRef = mockOverlayRef;

      component.ngOnDestroy();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
    });

    it('should not throw on destroy when no overlay exists', () => {
      (component as any).overlayRef = null;

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('Chapter Changes', () => {
    beforeEach(() => {
      mockService.getProductTypePrioritizations.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
    });

    it('should reset all state when chapter changes', () => {
      component.sidePanelOpen = true;
      component.appliedFilters = {
        productType: 'PT001',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.filterChips = [{ key: 'productType', label: 'PT001', value: 'PT001' }];
      component.searchText = 'test';
      component.requestState = { searchKeyword: 'test', productType: 'PT001' };
      spyOn(filterDataService, 'clearData');
      mockService.getProductTypePrioritizations.calls.reset();

      chapterChangedSubject.next();

      expect(component.sidePanelOpen).toBe(false);
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.searchText).toBe('');
      expect(component.requestState).toEqual({});
      expect(filterDataService.clearData).toHaveBeenCalledWith('product-type-prioritization');
      expect(mockService.getProductTypePrioritizations).toHaveBeenCalled();
    });

    it('should clear searchBarComponent when chapter changes', () => {
      component.searchBarComponent = { clearSearch: jasmine.createSpy(), focus: jasmine.createSpy(), searchText: '' } as any;
      mockService.getProductTypePrioritizations.calls.reset();

      chapterChangedSubject.next();

      expect(component.searchBarComponent.clearSearch).toHaveBeenCalled();
    });

    it('should reset sort config direction when chapter changes', () => {
      component.tableConfig.sortConfig = { column: 'productType', direction: 'A' };
      mockService.getProductTypePrioritizations.calls.reset();

      chapterChangedSubject.next();

      expect(component.tableConfig.sortConfig!.direction).toBe('default');
    });

    it('should dispose overlay when chapter changes if overlay exists', () => {
      const mockOverlayRef = { dispose: jasmine.createSpy() };
      (component as any).overlayRef = mockOverlayRef;
      component.isFilterOpen = true;
      mockService.getProductTypePrioritizations.calls.reset();

      chapterChangedSubject.next();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect((component as any).overlayRef).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });
  });

  describe('Open Filter', () => {
    beforeEach(() => {
      mockService.getProductTypePrioritizations.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
    });

    it('should close overlay if already open when openFilter is called', () => {
      const mockOverlayRef = { dispose: jasmine.createSpy() };
      (component as any).overlayRef = mockOverlayRef;
      component.isFilterOpen = true;

      component.openFilter();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect((component as any).overlayRef).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });
  });

  describe('updateRequestStateFromFilters', () => {
    beforeEach(() => {
      mockService.getProductTypePrioritizations.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
    });

    it('should clear filter keys from requestState when appliedFilters is null', () => {
      component.requestState = {
        productType: 'PT001',
        effDateAfter: '2024-01-01',
        effDateBefore: '2024-12-31',
        termDateAfter: '2024-01-01',
        termDateBefore: '2024-12-31',
        searchKeyword: 'test'
      };
      component.appliedFilters = null;

      (component as any).updateRequestStateFromFilters();

      expect(component.requestState.productType).toBeUndefined();
      expect(component.requestState.effDateAfter).toBeUndefined();
      expect(component.requestState.effDateBefore).toBeUndefined();
      expect(component.requestState.termDateAfter).toBeUndefined();
      expect(component.requestState.termDateBefore).toBeUndefined();
      expect(component.requestState.searchKeyword).toBe('test');
    });

    it('should update requestState from appliedFilters when filters exist', () => {
      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.returnValue('2024-06-01');

      component.appliedFilters = {
        productType: 'PT002',
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-06-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      (component as any).updateRequestStateFromFilters();

      expect(component.requestState.productType).toBe('PT002');
      expect(component.requestState.effDateAfter).toBe('2024-06-01');
    });
  });
});
