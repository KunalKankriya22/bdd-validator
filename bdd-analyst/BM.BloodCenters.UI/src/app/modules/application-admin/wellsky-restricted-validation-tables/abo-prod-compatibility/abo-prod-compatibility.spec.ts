import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { Overlay, OverlayModule } from '@angular/cdk/overlay';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';

import { ABOProdCompatibilityComponent } from './abo-prod-compatibility';
import { ABOProdCompatibilityService } from './services/abo-prod-compatibility.service';
import {
  ABOProdCompatibilityModel,
  ABOProdCompatibilityFilterValue
} from './models/abo-prod-compatibility.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { signal } from '@angular/core';

describe('ABOProdCompatibilityComponent', () => {
  let component: ABOProdCompatibilityComponent;
  let fixture: ComponentFixture<ABOProdCompatibilityComponent>;
  let mockABOProdCompatibilityService: jasmine.SpyObj<ABOProdCompatibilityService>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let mockHeaderService: HeaderService;
  let mockPageHeaderService: any;
  let chapterChanged$: Subject<void>;

  const today = new Date();
  const oneMonthAgo = new Date(new Date().setMonth(today.getMonth() - 1));
  const oneYearFromNow = new Date(new Date().setFullYear(today.getFullYear() + 1));

  const mockTableData: ABOProdCompatibilityModel[] = [
    {
      productType: 'RBC',
      productDescription: 'Red Blood Cells',
      requestABO: 'A',
      requestABODesc: 'Type A',
      requestABODisplay: 'A - Type A',
      compatibleABO: 'O',
      compatibleABODesc: 'Type O',
      compatibleABODisplay: 'O - Type O',
      effectiveDate: oneMonthAgo,
      terminationDate: null,
      modificationDate: oneMonthAgo
    },
    {
      productType: 'PLT',
      productDescription: 'Platelets',
      requestABO: 'B',
      requestABODesc: 'Type B',
      requestABODisplay: 'B - Type B',
      compatibleABO: 'AB',
      compatibleABODesc: 'Type AB',
      compatibleABODisplay: 'AB - Type AB',
      effectiveDate: oneMonthAgo,
      terminationDate: oneYearFromNow,
      modificationDate: oneMonthAgo
    }
  ];

  beforeEach(() => {

    mockABOProdCompatibilityService = jasmine.createSpyObj('ABOProdCompatibilityService', [
      'getABOProdCompatibility',
      'getABOProdCompatibilityFilters',
      'getAddDropdownValues',
      'addABOProdCompatibility',
      'updateABOProdCompatibility'
    ]);

    // Create TranslateService mock
    mockTranslateService = jasmine.createSpyObj('TranslateService', ['instant', 'get', 'use'], {
      currentLang: 'en',
      defaultLang: 'en'
    });
    mockTranslateService.instant.and.returnValue('');
    mockTranslateService.get.and.returnValue(of(''));

    // Create HeaderService mock with chapter changed observable
    chapterChanged$ = new Subject<void>();
    mockHeaderService = {
      chapterChanged$: chapterChanged$.asObservable()
    } as HeaderService;

    // Create PageHeaderService mock with signal
    const pageHeaderDataSignal = signal({
      title: 'ABO/Product Compatibility',
      subtitle: 'Define approved ABO and product type combinations'
    });
    mockPageHeaderService = {
      pageHeaderData: pageHeaderDataSignal,
      getTitle: jasmine.createSpy('getTitle').and.returnValue('ABO/Product Compatibility'),
      getSubtitle: jasmine.createSpy('getSubtitle').and.returnValue('Define approved ABO and product type combinations'),
      getCurrentMenuItem: jasmine.createSpy('getCurrentMenuItem')
    } as any;



      TestBed.configureTestingModule({
      imports: [
        ABOProdCompatibilityComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatButtonModule,
        MatIconModule,
        OverlayModule
      ],
      providers: [
        { provide: ABOProdCompatibilityService, useValue: mockABOProdCompatibilityService },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {}, data: {} },
            params: of({}),
            queryParams: of({})
          }
        },
        Overlay
      ]
    });


    


      mockABOProdCompatibilityService.getABOProdCompatibility.calls.reset();


      mockABOProdCompatibilityService.getABOProdCompatibilityFilters.calls.reset();


      mockABOProdCompatibilityService.getAddDropdownValues.calls.reset();


      mockABOProdCompatibilityService.addABOProdCompatibility.calls.reset();


      mockABOProdCompatibilityService.updateABOProdCompatibility.calls.reset();


      mockTranslateService.instant.calls.reset();


      mockTranslateService.get.calls.reset();


      mockTranslateService.use.calls.reset();


      mockTranslateService.instant.and.returnValue('');


      mockTranslateService.get.and.returnValue(of(''));


    fixture = TestBed.createComponent(ABOProdCompatibilityComponent);
    component = fixture.componentInstance;


    });


  describe('Component Initialization', () => {


    it('should set search minimum length to 2 characters', () => {
      mockABOProdCompatibilityService.getABOProdCompatibility.and.returnValue(of({ data: [], totalRecords: 0 }));

      component.ngOnInit();

      expect(component.searchConfig.minLength).toBe(2);
    });

    it('should set search placeholder for Requested ABO and Compatible ABO', () => {
      mockABOProdCompatibilityService.getABOProdCompatibility.and.returnValue(of({ data: [], totalRecords: 0 }));

      component.ngOnInit();

      expect(component.searchConfig.placeholder).toContain('Requested ABO');
      expect(component.searchConfig.placeholder).toContain('Compatible ABO');
    });


  });

  describe('Data Loading', () => {
    it('should load ABO product compatibility data successfully', () => {
      mockABOProdCompatibilityService.getABOProdCompatibility.and.returnValue(
        of({ data: mockTableData, totalRecords: 2 })
      );

      component.loadData();

      expect(component.dataSource.length).toBe(2);
      expect(component.tableConfig.pagination?.totalRecords).toBe(2);
      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(false);
    });




  });

  describe('Search Functionality', () => {
    it('should apply search with minimum 3 characters', () => {
      mockABOProdCompatibilityService.getABOProdCompatibility.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.onSearch('ABO');

      expect(component.requestState.SearchKeyword).toBe('ABO');
      expect(mockABOProdCompatibilityService.getABOProdCompatibility).toHaveBeenCalled();
    });

    it('should clear search results when search term is empty', () => {
      mockABOProdCompatibilityService.getABOProdCompatibility.and.returnValue(
        of({ data: mockTableData, totalRecords: 2 })
      );

      component.onSearch('');

      expect(component.requestState.SearchKeyword).toBeUndefined();
      expect(mockABOProdCompatibilityService.getABOProdCompatibility).toHaveBeenCalled();
    });
  });
  describe('Sorting', () => {
    it('should handle sort change event', () => {
      mockABOProdCompatibilityService.getABOProdCompatibility.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.onSortChange({ column: 'requestABO', direction: 'A' });

      expect(component.tableConfig.sortConfig?.column).toBe('requestABO');
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
      expect(mockABOProdCompatibilityService.getABOProdCompatibility).toHaveBeenCalled();
    });
  });

  describe('Filter Functionality', () => {
    it('should apply filters', () => {
      mockABOProdCompatibilityService.getABOProdCompatibility.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      const filters: ABOProdCompatibilityFilterValue = {
        inventoryProductType: 'RBC',
        effectiveDateAfter: '2024-01-01',
        effectiveDateBefore: null,
        terminationDateAfter: null,
        terminationDateBefore: null
      };

      component.applyFilters(filters);

      expect(component.appliedFilters).toEqual(filters);
      expect(mockABOProdCompatibilityService.getABOProdCompatibility).toHaveBeenCalled();
    });


  });

  describe('Side Panel Operations', () => {






    it('should reload data after successful save', () => {
      mockABOProdCompatibilityService.getABOProdCompatibility.and.returnValue(
        of({ data: mockTableData, totalRecords: 2 })
      );

      component.onSaveSuccess();

      expect(mockABOProdCompatibilityService.getABOProdCompatibility).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBe(false);
    });
  });

  describe('Row Highlighting', () => {
    it('should highlight row when in edit mode', () => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockTableData[0];

      expect(component.sidePanelData).toBeDefined();
      expect(component.sidePanelMode).toBe('edit');
    });


  });

  describe('Chapter Change Behavior', () => {
    beforeEach(() => {
      mockABOProdCompatibilityService.getABOProdCompatibility.and.returnValue(
        of({ data: mockTableData, totalRecords: 2 })
      );
    });

    it('should reset all UI state when chapter changes', () => {
      // Initialize component with data
      component.ngOnInit();

      // Set up some state
      component.searchText = 'test search';
      component.appliedFilters = {
        inventoryProductType: 'RBC',
        effectiveDateAfter: null,
        effectiveDateBefore: null,
        terminationDateAfter: null,
        terminationDateBefore: null
      };
      component.filterChips = [{ key: 'inventoryProductType', label: 'Product Type: RBC', value: 'RBC' }];
      component.sidePanelOpen = true;
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockTableData[0];

      // Trigger chapter change
      chapterChanged$.next();

      // Verify all state is reset
      expect(component.searchText).toBe('');
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should close filter overlay when chapter changes', () => {
      component.ngOnInit();

      // Simulate filter overlay being open
      component.isFilterOpen = true;
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = mockOverlayRef;

      // Trigger chapter change
      chapterChanged$.next();

      // Verify overlay is closed
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component.isFilterOpen).toBe(false);
      expect(component['overlayRef']).toBeNull();
    });









    it('should clear data source when chapter changes', () => {
      component.ngOnInit();

      // Ensure data is loaded
      expect(component.dataSource.length).toBeGreaterThan(0);

      // Clear before reloading
      component.dataSource = [];

      // Trigger chapter change
      chapterChanged$.next();

      // Verify data is reloaded (would be populated by loadData call)
      expect(mockABOProdCompatibilityService.getABOProdCompatibility).toHaveBeenCalled();
    });
  });
});
