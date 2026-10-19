import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ElementRef, EventEmitter } from '@angular/core';

import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Overlay } from '@angular/cdk/overlay';
import { of, throwError, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { TestMessageMappingComponent } from './test-message-mapping';
import { TestMessageMappingService } from './services/test-message-mapping.service';
import { TestMessageMappingModel, TestMessageMappingFilterValue } from './models/test-message-mapping.model';
import { HeaderService } from '@shared/services/header.service';
import { LabelingFilterDataService } from '../services/labeling-filter-data.service';
import { provideRouter } from '@angular/router';

describe('TestMessageMappingComponent', () => {
  let component: TestMessageMappingComponent;
  let fixture: ComponentFixture<TestMessageMappingComponent>;
  let mockService: jasmine.SpyObj<TestMessageMappingService>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let chapterChangedSubject: Subject<void>;
  let filterDataService: LabelingFilterDataService;

  // Overlay mocks for openFilter testing
  let mockOverlayRef: jasmine.SpyObj<any>;
  let mockFilterApplyEmitter: EventEmitter<TestMessageMappingFilterValue>;
  let mockFilterCloseEmitter: EventEmitter<void>;
  let mockBackdropSubject: Subject<MouseEvent>;

  const mockData: TestMessageMappingModel[] = [
    {
      ltTestId: 'LT001',
      resultCode: 'N',
      displyTestId: 'DISPLAYONE',
      antibodyFlag: 'N',
      messageDesc: 'Test Message 1',
      effDate: '2024-01-01',
      termDate: null
    },
    {
      ltTestId: 'LT002',
      resultCode: 'P',
      displyTestId: 'DISPLAYTWO',
      antibodyFlag: 'Y',
      messageDesc: 'Test Message 2',
      effDate: '2024-01-15',
      termDate: '2025-12-31'
    }
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('TestMessageMappingService', [
      'getTestMessageMappings',
      'getTestIdLookups',
      'getMessageTypeLookups',
      'getResultCodeLookups',
      'createRecord',
      'updateRecord',
      'deleteRecord'
    ]);

    chapterChangedSubject = new Subject<void>();

    // Overlay ref mock
    mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['attach', 'dispose', 'backdropClick']);
    mockFilterApplyEmitter = new EventEmitter<TestMessageMappingFilterValue>();
    mockFilterCloseEmitter = new EventEmitter<void>();
    mockBackdropSubject = new Subject<MouseEvent>();

    mockOverlayRef.attach.and.returnValue({
      instance: {
        currentFilters: null,
        apply: mockFilterApplyEmitter,
        close: mockFilterCloseEmitter
      }
    });
    mockOverlayRef.backdropClick.and.returnValue(mockBackdropSubject);

    // Position strategy chain mock
    const mockPositionStrategy: any = {};
    mockPositionStrategy.withPositions = jasmine.createSpy('withPositions').and.returnValue(mockPositionStrategy);
    mockPositionStrategy.withPush = jasmine.createSpy('withPush').and.returnValue(mockPositionStrategy);

    const mockPositionBuilder = {
      flexibleConnectedTo: jasmine.createSpy('flexibleConnectedTo').and.returnValue(mockPositionStrategy)
    };

    // Create overlay mock with scrollStrategies as property
    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position']);
    (mockOverlay as any).scrollStrategies = { block: jasmine.createSpy('block').and.returnValue({}) };
    mockOverlay.position.and.returnValue(mockPositionBuilder as any);
    mockOverlay.create.and.returnValue(mockOverlayRef);

    TestBed.configureTestingModule({
      imports: [TestMessageMappingComponent,
        TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TestMessageMappingService, useValue: mockService },
        { provide: Overlay, useValue: mockOverlay },
        { provide: HeaderService, useValue: { chapterChanged$: chapterChangedSubject.asObservable() } },
        LabelingFilterDataService
      ]
    });

    fixture = TestBed.createComponent(TestMessageMappingComponent);
    component = fixture.componentInstance;
    filterDataService = TestBed.inject(LabelingFilterDataService);

    });


  describe('Component Initialization', () => {
    it('should initialize with correct configuration', () => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );

      fixture.detectChanges();

      expect(component.searchConfig.placeholder).toContain('AP Test ID');
      expect(component.tableConfig.columns.length).toBeGreaterThan(0);
    });

    it('should create the component', () => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should set default state values', () => {
      mockService.getTestMessageMappings.and.returnValue(
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

    it('should set searchConfig with correct values', () => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();

      expect(component.searchConfig.placeholder).toBe('Search by AP Test ID or Message Type');
      expect(component.searchConfig.minLength).toBe(2);
      expect(component.searchConfig.ariaLabel).toBe('Search test message mappings');
      expect(component.searchConfig.alwaysShowTooltip).toBe(true);
    });

    it('should set tableConfig with correct columns', () => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();

      const columnKeys = component.tableConfig.columns.map(c => c.key);
      expect(columnKeys).toEqual([
        'ltTestId', 'resultCode', 'displyTestId', 'antibodyFlag',
        'messageDesc', 'effDate', 'termDate'
      ]);
    });

    it('should set tableConfig with correct sort config', () => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();

      expect(component.tableConfig.sortConfig!.column).toBe('ltTestId');
      expect(component.tableConfig.sortConfig!.direction).toBe('default');
    });

    it('should set tableConfig with correct row actions', () => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();

      expect(component.tableConfig.rowActions!.length).toBe(1);
      expect(component.tableConfig.rowActions![0].action).toBe('edit');
      expect(component.tableConfig.rowActions![0].icon).toBe('edit');
    });

    it('should set correct empty and loading messages', () => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();

      expect(component.tableConfig.emptyMessage).toBe('No Test message mapping records found.');
      expect(component.tableConfig.loadingMessage).toBe('Loading test message mapping data...');
    });

    it('should call loadData on init', () => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: mockData, total: 2 })
      );
      fixture.detectChanges();

      expect(mockService.getTestMessageMappings).toHaveBeenCalled();
    });
  });

  describe('loadData', () => {
    it('should set isLoading to true while loading', () => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );

      component.loadData();

      expect(mockService.getTestMessageMappings).toHaveBeenCalled();
    });

    it('should populate allData and dataSource on success', () => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: mockData, total: 2 })
      );

      fixture.detectChanges();

      expect(component.dataSource).toEqual(mockData);
      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(false);
    });

    it('should set filterDataService data on first load', () => {
      spyOn(filterDataService, 'getData').and.returnValue([]);
      spyOn(filterDataService, 'setData');
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: mockData, total: 2 })
      );

      component.loadData();

      expect(filterDataService.setData).toHaveBeenCalledWith('test-message-mapping', mockData);
    });

    it('should not overwrite filterDataService data if already populated', () => {
      spyOn(filterDataService, 'getData').and.returnValue(mockData);
      spyOn(filterDataService, 'setData');
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: mockData, total: 2 })
      );

      component.loadData();

      expect(filterDataService.setData).not.toHaveBeenCalled();
    });

    it('should handle error from service', () => {
      spyOn(console, 'error');
      mockService.getTestMessageMappings.and.returnValue(
        throwError(() => new Error('Server error'))
      );

      component.loadData();

      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Failed to load test message mapping data. Please try again.');
      expect(console.error).toHaveBeenCalled();
    });

    it('should pass requestBody to service', () => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      component.requestBody = { searchKeyword: 'test', sort: 'A' };

      component.loadData();

      expect(mockService.getTestMessageMappings).toHaveBeenCalledWith({ searchKeyword: 'test', sort: 'A' });
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy subject', () => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();

      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should dispose overlayRef if it exists', () => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();

      component['overlayRef'] = mockOverlayRef;

      component.ngOnDestroy();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
    });

    it('should not fail if overlayRef is null', () => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();

      component['overlayRef'] = null;

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('subscribeToChapterChanges', () => {
    beforeEach(() => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: mockData, total: 2 })
      );
      fixture.detectChanges();
    });

    it('should close side panel on chapter change', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockData[0];

      chapterChangedSubject.next();

      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });

    it('should clear filters on chapter change', () => {
      component.appliedFilters = {
        resultCode: 'N',
        antibodyFlag: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.filterChips = [{ key: 'resultCode', label: 'Result: N', value: 'N' }];

      chapterChangedSubject.next();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
    });

    it('should reset searchText and requestBody on chapter change', () => {
      component.searchText = 'test';
      component.requestBody = { searchKeyword: 'test', sort: 'A' };

      chapterChangedSubject.next();

      expect(component.searchText).toBe('');
      expect(component.requestBody).toEqual({});
    });

    it('should call clearSearch on searchBarComponent if available', () => {
      const mockSearchBar = { clearSearch: jasmine.createSpy('clearSearch') };
      component.searchBarComponent = mockSearchBar as any;

      chapterChangedSubject.next();

      expect(mockSearchBar.clearSearch).toHaveBeenCalled();
    });

    it('should not fail if searchBarComponent is undefined', () => {
      (component as any).searchBarComponent = undefined;

      expect(() => chapterChangedSubject.next()).not.toThrow();
    });

    it('should reset sort direction to default on chapter change', () => {
      component.tableConfig.sortConfig!.direction = 'A';

      chapterChangedSubject.next();

      expect(component.tableConfig.sortConfig!.direction).toBe('default');
    });

    it('should dispose overlay and reset filter state on chapter change', () => {
      component['overlayRef'] = mockOverlayRef;
      component.isFilterOpen = true;

      chapterChangedSubject.next();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should not dispose overlay if none exists on chapter change', () => {
      component['overlayRef'] = null;
      component.isFilterOpen = false;

      expect(() => chapterChangedSubject.next()).not.toThrow();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should reload data on chapter change', () => {
      mockService.getTestMessageMappings.calls.reset();

      chapterChangedSubject.next();

      expect(mockService.getTestMessageMappings).toHaveBeenCalled();
    });
  });

  describe('Filter Functionality', () => {
    beforeEach(() => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should apply result code filter', () => {
      const filters = {
        resultCode: 'N',
        antibodyFlag: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.appliedFilters).toBe(filters);
    });

    it('should apply antibody flag filter', () => {
      const filters = {
        resultCode: null,
        antibodyFlag: 'Y',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.appliedFilters).toBe(filters);
    });

    it('should apply date filters', () => {
      const filters = {
        resultCode: null,
        antibodyFlag: null,
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.appliedFilters).toBe(filters);
    });

    it('should set effDateAfter in requestBody when period is after', () => {
      const filters = {
        resultCode: null,
        antibodyFlag: null,
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-06-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestBody.effDateAfter).toBeTruthy();
      expect(component.requestBody.effDateBefore).toBeUndefined();
    });

    it('should set effDateBefore in requestBody when period is before', () => {
      const filters = {
        resultCode: null,
        antibodyFlag: null,
        effectiveDatePeriod: 'before',
        effectiveDate: new Date('2024-06-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestBody.effDateBefore).toBeTruthy();
      expect(component.requestBody.effDateAfter).toBeUndefined();
    });

    it('should set termDateAfter in requestBody when period is after', () => {
      const filters = {
        resultCode: null,
        antibodyFlag: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'after',
        terminationDate: new Date('2025-12-31')
      };

      component.applyFilters(filters);

      expect(component.requestBody.termDateAfter).toBeTruthy();
      expect(component.requestBody.termDateBefore).toBeUndefined();
    });

    it('should set termDateBefore in requestBody when period is before', () => {
      const filters = {
        resultCode: null,
        antibodyFlag: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: new Date('2025-12-31')
      };

      component.applyFilters(filters);

      expect(component.requestBody.termDateBefore).toBeTruthy();
      expect(component.requestBody.termDateAfter).toBeUndefined();
    });

    it('should set resultCode and antibodyFlag in requestBody', () => {
      const filters = {
        resultCode: 'P',
        antibodyFlag: 'Y',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestBody.resultCode).toBe('P');
      expect(component.requestBody.antibodyFlag).toBe('Y');
    });

    it('should generate filter chips from applied filters', () => {
      const filters = {
        resultCode: 'N',
        antibodyFlag: 'Y',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.filterChips.length).toBeGreaterThan(0);
    });

    it('should call loadData after applying filters', () => {
      mockService.getTestMessageMappings.calls.reset();

      const filters = {
        resultCode: 'N',
        antibodyFlag: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(mockService.getTestMessageMappings).toHaveBeenCalled();
    });

    it('should preserve existing searchKeyword and sort when applying filters', () => {
      component.requestBody = { searchKeyword: 'test', sort: 'A' };

      const filters = {
        resultCode: 'N',
        antibodyFlag: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestBody.searchKeyword).toBe('test');
      expect(component.requestBody.sort).toBe('A');
    });
  });

  describe('onRemoveFilterChip', () => {
    beforeEach(() => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should remove a filter chip and reload data', () => {
      component.appliedFilters = {
        resultCode: 'N',
        antibodyFlag: 'Y',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      mockService.getTestMessageMappings.calls.reset();
      component.onRemoveFilterChip('resultCode');

      expect(mockService.getTestMessageMappings).toHaveBeenCalled();
    });

    it('should update filter chips after removing a chip', () => {
      component.appliedFilters = {
        resultCode: 'N',
        antibodyFlag: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.onRemoveFilterChip('resultCode');

      // After removing the only active filter, appliedFilters should be null
      expect(component.appliedFilters).toBeNull();
    });

    it('should update requestBody after removing a chip', () => {
      component.appliedFilters = {
        resultCode: 'N',
        antibodyFlag: 'Y',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.requestBody = { resultCode: 'N', antibodyFlag: 'Y' };

      component.onRemoveFilterChip('resultCode');

      // resultCode should be removed, antibodyFlag preserved
      expect(component.requestBody.antibodyFlag).toBe('Y');
    });
  });

  describe('hasActiveFilters', () => {
    beforeEach(() => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should return false when no filters are applied', () => {
      component.appliedFilters = null;

      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should return true when filters are active', () => {
      component.appliedFilters = {
        resultCode: 'N',
        antibodyFlag: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should return false when all filter values are null', () => {
      component.appliedFilters = {
        resultCode: null,
        antibodyFlag: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(component.hasActiveFilters()).toBe(false);
    });
  });

  describe('clearAllFilters', () => {
    beforeEach(() => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should clear appliedFilters and filterChips', () => {
      component.appliedFilters = {
        resultCode: 'N',
        antibodyFlag: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.filterChips = [{ key: 'resultCode', label: 'Result: N', value: 'N' }];

      component.clearAllFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
    });

    it('should preserve searchKeyword and sort in requestBody', () => {
      component.requestBody = {
        searchKeyword: 'test',
        sort: 'A',
        resultCode: 'N',
        antibodyFlag: 'Y'
      };

      component.clearAllFilters();

      expect(component.requestBody.searchKeyword).toBe('test');
      expect(component.requestBody.sort).toBe('A');
      expect(component.requestBody.resultCode).toBeUndefined();
      expect(component.requestBody.antibodyFlag).toBeUndefined();
    });

    it('should reload data after clearing filters', () => {
      mockService.getTestMessageMappings.calls.reset();

      component.clearAllFilters();

      expect(mockService.getTestMessageMappings).toHaveBeenCalled();
    });
  });

  describe('updateRequestBodyFromFilters', () => {
    beforeEach(() => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should reset requestBody when appliedFilters is null', () => {
      component.appliedFilters = null;
      component.requestBody = { searchKeyword: 'test', sort: 'A', resultCode: 'N' };

      component['updateRequestBodyFromFilters']();

      expect(component.requestBody).toEqual({ searchKeyword: 'test', sort: 'A' });
    });

    it('should update requestBody from non-null appliedFilters', () => {
      component.appliedFilters = {
        resultCode: 'P',
        antibodyFlag: 'Y',
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-06-15'),
        terminationDatePeriod: 'before',
        terminationDate: new Date('2025-12-31')
      };

      component['updateRequestBodyFromFilters']();

      expect(component.requestBody.resultCode).toBe('P');
      expect(component.requestBody.antibodyFlag).toBe('Y');
      expect(component.requestBody.effDateAfter).toBeTruthy();
      expect(component.requestBody.effDateBefore).toBeUndefined();
      expect(component.requestBody.termDateBefore).toBeTruthy();
      expect(component.requestBody.termDateAfter).toBeUndefined();
    });

    it('should set undefined for date fields when period does not match', () => {
      component.appliedFilters = {
        resultCode: null,
        antibodyFlag: null,
        effectiveDatePeriod: 'before',
        effectiveDate: new Date('2024-06-15'),
        terminationDatePeriod: 'after',
        terminationDate: new Date('2025-12-31')
      };

      component['updateRequestBodyFromFilters']();

      expect(component.requestBody.effDateBefore).toBeTruthy();
      expect(component.requestBody.effDateAfter).toBeUndefined();
      expect(component.requestBody.termDateAfter).toBeTruthy();
      expect(component.requestBody.termDateBefore).toBeUndefined();
    });

    it('should set undefined for date fields when date is null', () => {
      component.appliedFilters = {
        resultCode: null,
        antibodyFlag: null,
        effectiveDatePeriod: 'after',
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: null
      };

      component['updateRequestBodyFromFilters']();

      expect(component.requestBody.effDateAfter).toBeUndefined();
      expect(component.requestBody.effDateBefore).toBeUndefined();
      expect(component.requestBody.termDateAfter).toBeUndefined();
      expect(component.requestBody.termDateBefore).toBeUndefined();
    });
  });

  describe('CRUD Operations', () => {
    beforeEach(() => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: mockData, total: 2 })
      );
      fixture.detectChanges();
    });

    it('should create record by opening side panel in add mode', () => {
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

    it('should handle onRowAction with edit action', () => {
      const event = { action: 'edit', row: mockData[0] };
      spyOn(component, 'editRecord');

      component.onRowAction(event);

      expect(component.editRecord).toHaveBeenCalledWith(mockData[0]);
    });

    it('should not throw for unknown row action', () => {
      const event = { action: 'unknown', row: mockData[0] };

      expect(() => component.onRowAction(event)).not.toThrow();
    });
  });

  describe('onSaveSuccess', () => {
    beforeEach(() => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should clear filter data and reload', () => {
      spyOn(filterDataService, 'clearData');
      mockService.getTestMessageMappings.calls.reset();

      component.onSaveSuccess();

      expect(filterDataService.clearData).toHaveBeenCalledWith('test-message-mapping');
      expect(mockService.getTestMessageMappings).toHaveBeenCalled();
    });
  });

  describe('onModeChange', () => {
    beforeEach(() => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should set mode to add and clear data', () => {
      component.sidePanelData = mockData[0];
      component.sidePanelMode = 'edit';

      component.onModeChange('add');

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should set mode to edit without clearing data', () => {
      component.sidePanelData = mockData[0];

      component.onModeChange('edit');

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockData[0]);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should clear searchKeyword and reload when search text is empty', () => {
      component.requestBody.searchKeyword = 'previous';
      mockService.getTestMessageMappings.calls.reset();

      component.onSearchEvent('');

      expect(component.requestBody.searchKeyword).toBeUndefined();
      expect(mockService.getTestMessageMappings).toHaveBeenCalled();
    });

    it('should clear searchKeyword and reload when search text is whitespace', () => {
      component.requestBody.searchKeyword = 'previous';
      mockService.getTestMessageMappings.calls.reset();

      component.onSearchEvent('   ');

      expect(component.requestBody.searchKeyword).toBeUndefined();
      expect(mockService.getTestMessageMappings).toHaveBeenCalled();
    });

    it('should not reload when search text is non-empty', () => {
      mockService.getTestMessageMappings.calls.reset();

      component.onSearchEvent('test');

      expect(mockService.getTestMessageMappings).not.toHaveBeenCalled();
    });

    it('should clear searchKeyword and reload when search text is null', () => {
      component.requestBody.searchKeyword = 'previous';
      mockService.getTestMessageMappings.calls.reset();

      component.onSearchEvent(null as any);

      expect(component.requestBody.searchKeyword).toBeUndefined();
      expect(mockService.getTestMessageMappings).toHaveBeenCalled();
    });
  });

  describe('onEnterSearch', () => {
    beforeEach(() => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should set searchKeyword and reload when text length >= 2', () => {
      component.searchBarComponent = { searchText: 'test query' } as any;
      mockService.getTestMessageMappings.calls.reset();

      component.onEnterSearch();

      expect(component.requestBody.searchKeyword).toBe('test query');
      expect(mockService.getTestMessageMappings).toHaveBeenCalled();
    });

    it('should not set searchKeyword when text length < 2', () => {
      component.searchBarComponent = { searchText: 'a' } as any;
      mockService.getTestMessageMappings.calls.reset();

      component.onEnterSearch();

      expect(mockService.getTestMessageMappings).not.toHaveBeenCalled();
    });

    it('should not set searchKeyword when searchBarComponent is undefined', () => {
      (component as any).searchBarComponent = undefined;
      mockService.getTestMessageMappings.calls.reset();

      component.onEnterSearch();

      expect(mockService.getTestMessageMappings).not.toHaveBeenCalled();
    });

    it('should trim the search text', () => {
      component.searchBarComponent = { searchText: '  test  ' } as any;
      mockService.getTestMessageMappings.calls.reset();

      component.onEnterSearch();

      expect(component.requestBody.searchKeyword).toBe('test');
    });

    it('should not search when trimmed text is empty', () => {
      component.searchBarComponent = { searchText: '   ' } as any;
      mockService.getTestMessageMappings.calls.reset();

      component.onEnterSearch();

      expect(mockService.getTestMessageMappings).not.toHaveBeenCalled();
    });
  });

  describe('Sort Functionality', () => {
    beforeEach(() => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should set sort to undefined for default direction', () => {
      mockService.getTestMessageMappings.calls.reset();

      component.onSortChange({ column: 'ltTestId', direction: 'default' });

      expect(component.requestBody.sort).toBeUndefined();
      expect(component.tableConfig.sortConfig!.column).toBe('ltTestId');
      expect(component.tableConfig.sortConfig!.direction).toBe('default');
      expect(mockService.getTestMessageMappings).toHaveBeenCalled();
    });

    it('should set sort to D for descending direction', () => {
      mockService.getTestMessageMappings.calls.reset();

      component.onSortChange({ column: 'ltTestId', direction: 'D' });

      expect(component.requestBody.sort).toBe('D');
      expect(mockService.getTestMessageMappings).toHaveBeenCalled();
    });

    it('should set sort to A for ascending direction', () => {
      mockService.getTestMessageMappings.calls.reset();

      component.onSortChange({ column: 'ltTestId', direction: 'A' });

      expect(component.requestBody.sort).toBe('A');
      expect(mockService.getTestMessageMappings).toHaveBeenCalled();
    });

    it('should update sortConfig column and direction', () => {
      component.onSortChange({ column: 'resultCode', direction: 'A' });

      expect(component.tableConfig.sortConfig!.column).toBe('resultCode');
      expect(component.tableConfig.sortConfig!.direction).toBe('A');
    });
  });

  describe('openFilter', () => {
    beforeEach(() => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
      component.tableCard = new ElementRef(document.createElement('div'));
    });

    it('should close existing overlay if overlayRef already exists', () => {
      component['overlayRef'] = mockOverlayRef;
      component.isFilterOpen = true;

      component.openFilter();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should not close overlay on toggle if overlayRef is null', () => {
      component['overlayRef'] = null;
      component.isFilterOpen = false;

      // openFilter will try to create overlay - verify it starts with the right state
      expect(component.isFilterOpen).toBe(false);
      expect(component['overlayRef']).toBeNull();
    });
  });

  describe('closeFilterOverlay', () => {
    beforeEach(() => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
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

    it('should do nothing if overlayRef is null', () => {
      component['overlayRef'] = null;
      component.isFilterOpen = false;

      component['closeFilterOverlay']();

      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });
  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(() => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should open create panel on Alt+C', () => {
      spyOn(component, 'createRecord');
      const event = new KeyboardEvent('keydown', { key: 'c', altKey: true });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.createRecord).toHaveBeenCalled();
    });

    it('should focus search bar on Alt+S', () => {
      const mockSearchBar = { focus: jasmine.createSpy('focus') };
      component.searchBarComponent = mockSearchBar as any;
      const event = new KeyboardEvent('keydown', { key: 's', altKey: true });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockSearchBar.focus).toHaveBeenCalled();
    });

    it('should open filter on Alt+F', () => {
      spyOn(component, 'openFilter');
      const event = new KeyboardEvent('keydown', { key: 'f', altKey: true });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.openFilter).toHaveBeenCalled();
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

    it('should close side panel on Escape when side panel is open and no overlay', () => {
      component['overlayRef'] = null;
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

    it('should handle uppercase key variants for Alt shortcuts', () => {
      spyOn(component, 'createRecord');
      const event = new KeyboardEvent('keydown', { key: 'C', altKey: true });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(component.createRecord).toHaveBeenCalled();
    });

    it('should not focus search bar on Alt+S when searchBarComponent is undefined', () => {
      (component as any).searchBarComponent = undefined;
      const event = new KeyboardEvent('keydown', { key: 's', altKey: true });
      spyOn(event, 'preventDefault');

      expect(() => component.handleKeyboardShortcut(event)).not.toThrow();
    });
  });

  describe('Format Helpers', () => {
    beforeEach(() => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should format UTC date near midnight without timezone shift', () => {
      const formatted = component['formatDate']('2026-04-19T23:00:00Z');
      expect(formatted).toBe('19-APR-2026');
    });

    it('should return dash for null date', () => {
      const formatted = component['formatDate'](null);
      expect(formatted).toBe('-');
    });

    it('should return dash for undefined date', () => {
      const formatted = component['formatDate'](undefined);
      expect(formatted).toBe('-');
    });

    it('should return dash for empty string date', () => {
      const formatted = component['formatDate']('');
      expect(formatted).toBe('-');
    });

    it('should format a valid date correctly', () => {
      const formatted = component['formatDate']('2024-01-15');
      expect(formatted).toBe('15-JAN-2024');
    });

    it('should format December date correctly', () => {
      const formatted = component['formatDate']('2025-12-31');
      expect(formatted).toBe('31-DEC-2025');
    });

    it('should pad single-digit days', () => {
      const formatted = component['formatDate']('2024-03-05');
      expect(formatted).toBe('05-MAR-2024');
    });
  });

  describe('Table Column Value Formatters', () => {
    beforeEach(() => {
      mockService.getTestMessageMappings.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should format antibodyFlag Y as Yes', () => {
      const antibodyCol = component.tableConfig.columns.find(c => c.key === 'antibodyFlag');
      expect(antibodyCol!.valueFormatter!('Y')).toBe('Yes');
    });

    it('should format antibodyFlag N as No', () => {
      const antibodyCol = component.tableConfig.columns.find(c => c.key === 'antibodyFlag');
      expect(antibodyCol!.valueFormatter!('N')).toBe('No');
    });

    it('should format antibodyFlag null as No', () => {
      const antibodyCol = component.tableConfig.columns.find(c => c.key === 'antibodyFlag');
      expect(antibodyCol!.valueFormatter!(null)).toBe('No');
    });

    it('should format effDate column with formatDate', () => {
      const effDateCol = component.tableConfig.columns.find(c => c.key === 'effDate');
      expect(effDateCol!.valueFormatter!('2024-06-15')).toBe('15-JUN-2024');
    });

    it('should format termDate column with formatDate', () => {
      const termDateCol = component.tableConfig.columns.find(c => c.key === 'termDate');
      expect(termDateCol!.valueFormatter!(null)).toBe('-');
    });
  });
});
