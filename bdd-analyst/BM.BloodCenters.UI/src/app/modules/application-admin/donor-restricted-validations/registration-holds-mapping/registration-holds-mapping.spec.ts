import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { OverlayModule } from '@angular/cdk/overlay';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { RegistrationHoldsMappingComponent } from './registration-holds-mapping';
import { RegistrationHoldsMappingService } from './services/registration-holds-mapping.service';
import {
  RegistrationHoldsMappingModel,
  RegistrationHoldsMappingFilterValue
} from './models/registration-holds-mapping.model';
import { TableSortEvent, TablePageEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { createMockTranslateService, createMockMatDialog } from '@shared/testing/common-mocks';

describe('RegistrationHoldsMappingComponent', () => {
  let component: RegistrationHoldsMappingComponent;
  let fixture: ComponentFixture<RegistrationHoldsMappingComponent>;
  let mockService: jasmine.SpyObj<RegistrationHoldsMappingService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const mockData: RegistrationHoldsMappingModel[] = [
    {
      interdictionReason: 'ABOPPCUE',
      code: 'RH001',
      description: 'ABO Discrepancy - Positive Antibody Screen',
      effectiveDate: new Date('2024-01-15'),
      terminationDate: null,
      modificationDate: new Date('2024-11-20')
    },
    {
      interdictionReason: 'NOLOOKUP',
      code: 'RH002',
      description: 'No Lookup Available for Donor',
      effectiveDate: new Date('2024-02-10'),
      terminationDate: new Date('2025-12-31'),
      modificationDate: new Date('2024-12-05')
    }
  ];

  beforeEach(() => {
    mockService = jasmine.createSpyObj('RegistrationHoldsMappingService', [
      'getRegistrationHoldsMapping'
    ]);

    mockDialog = createMockMatDialog();
    const mockTranslateService = createMockTranslateService();
    const mockActivatedRoute = {
      snapshot: { params: {}, queryParams: {} },
      params: of({}),
      queryParams: of({})
    };

    TestBed.configureTestingModule({
      imports: [
        RegistrationHoldsMappingComponent,
        HttpClientTestingModule,
        OverlayModule],
      providers: [
        { provide: RegistrationHoldsMappingService, useValue: mockService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    });
  
    mockService.getRegistrationHoldsMapping.and.returnValue(
      of({ data: mockData, totalRecords: 2 })
    );

    fixture = TestBed.createComponent(RegistrationHoldsMappingComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {

    it('should initialize search configuration', () => {
      expect(component.searchConfig).toBeDefined();
      expect(component.searchConfig.placeholder).toBe('Search by code or interdiction reason');
      expect(component.searchConfig.minLength).toBe(2);
    });

    it('should initialize table configuration with pagination', () => {
      expect(component.tableConfig).toBeDefined();
      expect(component.tableConfig.pagination).toBeDefined();
      expect(component.tableConfig.pagination?.pageSize).toBe(25);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });

    it('should initialize table configuration with sort', () => {
      expect(component.tableConfig.sortConfig).toBeDefined();
      expect(component.tableConfig.sortConfig?.column).toBe('code');
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
    });


  });

  describe('Data Loading', () => {

    it('should handle successful data load', fakeAsync(() => {
      component.loadData();
      tick();

      expect(component.dataSource).toEqual(mockData);
      expect(component.hasError).toBe(false);
      expect(component.isLoading).toBe(false);
    }));


    it('should calculate skip parameter correctly', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 25;

      component.loadData();
      tick();

      expect(mockService.getRegistrationHoldsMapping).toHaveBeenCalledWith(
        25,
        50,
        jasmine.any(Object)
      );
    }));

  });

  describe('Search Functionality', () => {
    it('should add search keyword to request state', () => {
      component.onSearch('test search');

      expect(component.requestState.SearchKeyword).toBe('test search');
    });




    it('should trim search text', () => {
      component.onSearch('  test search  ');

      expect(component.requestState.SearchKeyword).toBe('test search');
    });
  });
  describe('Filter Management', () => {
    it('should apply filters with date and operator', () => {
      const filters: RegistrationHoldsMappingFilterValue = {
        effectiveDate: new Date('2024-01-15'),
        effectiveDatePeriod: 'AFTER',
        terminationDate: null,
        terminationDatePeriod: null
      };

      component.applyFilters(filters);

      expect(component.requestState.EffectiveDate).toBeDefined();
      expect(component.requestState.EffectiveDatePeriod).toBe('AFTER');
    });

    it('should create filter chips for applied filters', () => {
      const filters: RegistrationHoldsMappingFilterValue = {
        effectiveDate: new Date('2024-01-15'),
        effectiveDatePeriod: 'AFTER',
        terminationDate: new Date('2024-12-31'),
        terminationDatePeriod: 'BEFORE'
      };

      component.applyFilters(filters);

      expect(component.filterChips.length).toBe(2);
      expect(component.filterChips[0].key).toBe('effectiveDate');
      expect(component.filterChips[1].key).toBe('terminationDate');
    });


    it('should remove specific filter chip', () => {
      component.filterChips = [
        { key: 'effectiveDate', label: 'Effective Date AFTER 15-JAN-2024', value: new Date('2024-01-15') },
        { key: 'terminationDate', label: 'Termination Date BEFORE 31-DEC-2024', value: new Date('2024-12-31') }
      ];
      component.appliedFilters = {
        effectiveDate: new Date('2024-01-15'),
        effectiveDatePeriod: 'AFTER',
        terminationDate: new Date('2024-12-31'),
        terminationDatePeriod: 'BEFORE'
      };

      component.onRemoveFilterChip('effectiveDate');

      expect(component.filterChips.length).toBe(1);
      expect(component.filterChips[0].key).toBe('terminationDate');
      expect(component.requestState.EffectiveDate).toBeUndefined();
      expect(component.requestState.EffectiveDatePeriod).toBeUndefined();
    });



    it('should uppercase operator when applying filters', () => {
      const filters: RegistrationHoldsMappingFilterValue = {
        effectiveDate: new Date('2024-01-15'),
        effectiveDatePeriod: 'after',
        terminationDate: null,
        terminationDatePeriod: null
      };

      component.applyFilters(filters);

      expect(component.requestState.EffectiveDatePeriod).toBe('AFTER');
    });
  });
  describe('Row Actions', () => {

    it('should handle unknown row actions gracefully', () => {
      const actionEvent: TableRowActionEvent = {
        action: 'unknown',
        row: mockData[0]
      };

      // Should not throw error for unknown actions
      expect(() => component.onRowAction(actionEvent)).not.toThrow();
    });
  });

  describe('Filter Panel', () => {
    it('should initialize filter state as closed', () => {
      expect(component.isFilterOpen).toBe(false);
    });

    it('should toggle filter panel state', () => {
      // Create a mock element
      const mockElement = document.createElement('div');
      component.controlsSection = { nativeElement: mockElement } as any;

      expect(component.isFilterOpen).toBe(false);

      component.openFilter();

      expect(component.isFilterOpen).toBe(true);

      // Call again to toggle closed
      component.openFilter();

      expect(component.isFilterOpen).toBe(false);
    });

  });
  describe('Date Formatting', () => {


    it('should handle undefined dates', () => {
      const formatted = component['formatDate'](undefined);

      expect(formatted).toBe('-');
    });
  });
  describe('Table Columns', () => {
    it('should have all required columns', () => {
      const columns = component['getTableColumns']();

      expect(columns.length).toBeGreaterThan(0);
      expect(columns.find(c => c.key === 'interdictionReason')).toBeDefined();
      expect(columns.find(c => c.key === 'code')).toBeDefined();
      expect(columns.find(c => c.key === 'description')).toBeDefined();
      expect(columns.find(c => c.key === 'effectiveDate')).toBeDefined();
      expect(columns.find(c => c.key === 'terminationDate')).toBeDefined();
    });

  });
});
