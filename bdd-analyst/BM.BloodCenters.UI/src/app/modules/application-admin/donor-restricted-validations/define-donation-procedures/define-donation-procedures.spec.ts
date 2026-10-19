import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { OverlayContainer } from '@angular/cdk/overlay';
import { DefineDonationProceduresComponent } from './define-donation-procedures';
import { DefineDonationProceduresService } from './services/define-donation-procedures.service';
import { Router, NavigationEnd } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import moment from 'moment';
import { createMockMatDialog } from '@shared/testing/common-mocks';

describe('DefineDonationProceduresComponent', () => {
  let component: DefineDonationProceduresComponent;
  let fixture: ComponentFixture<DefineDonationProceduresComponent>;
  let mockService: jasmine.SpyObj<DefineDonationProceduresService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let overlayContainer: OverlayContainer;

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DefineDonationProceduresService', [
      'getDefineDonationProcedures',
      'getFilterDropdownValues',
      'getLookupDropdownValues',
      'addDonationProcedure',
      'updateDonationProcedure'
    ]);

    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      url: '/',
      events: of(new NavigationEnd(0, '/', '/'))
    });
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');

    mockDialog = createMockMatDialog();
    mockDialog.open.and.returnValue({
      afterClosed: () => of(false)
    } as any);

    // Setup default return values
    mockService.getFilterDropdownValues.and.returnValue(of({
      donationTypes: [{ key: 'WB', value: 'Whole Blood' }],
      procedureCodes: [{ key: 'P001', value: 'Standard Collection' }]
    }));



      TestBed.configureTestingModule({
      imports: [
        DefineDonationProceduresComponent,
        TranslateModule.forRoot(),
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: DefineDonationProceduresService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog }
      ]
    })
    .overrideComponent(DefineDonationProceduresComponent, {
      remove: { imports: [] },
      add: { providers: [{ provide: MatDialog, useValue: mockDialog }] }
    });


    


      mockService.getDefineDonationProcedures.calls.reset();


      mockService.getFilterDropdownValues.calls.reset();


      mockService.getLookupDropdownValues.calls.reset();


      mockService.addDonationProcedure.calls.reset();


      mockService.updateDonationProcedure.calls.reset();


      mockRouter.navigate.calls.reset();


      mockRouter.createUrlTree.calls.reset();


      mockRouter.serializeUrl.calls.reset();


      mockDialog.open.calls.reset();


      mockRouter.createUrlTree.and.returnValue({} as any);


      mockRouter.serializeUrl.and.returnValue('');


      mockService.getFilterDropdownValues.and.returnValue(of({
    }));


    overlayContainer = TestBed.inject(OverlayContainer);
    fixture = TestBed.createComponent(DefineDonationProceduresComponent);
    component = fixture.componentInstance;


    });

  afterEach(() => {
    overlayContainer.ngOnDestroy();
  });

  it('should create', () => {
    mockService.getDefineDonationProcedures.and.returnValue(
      of({ data: [], totalRecords: 0 })
    );
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize configurations on construction', () => {
    expect(component.headerConfig).toBeDefined();
    expect(component.searchConfig).toBeDefined();
    expect(component.tableConfig).toBeDefined();
  });

  it('should load data and filter values on init', () => {
    const mockData = {
      data: [
        {
          donationType: 'WB',
          donationTypeDescription: 'Whole Blood',
          procedureCode: 'P001',
          procedureCodeDescription: 'Standard Collection',
          effectiveDate: new Date(),
          terminationDate: null
        }
      ],
      totalRecords: 1
    };

    mockService.getDefineDonationProcedures.and.returnValue(of(mockData));

    component.ngOnInit();

    expect(mockService.getFilterDropdownValues).toHaveBeenCalled();
    expect(mockService.getDefineDonationProcedures).toHaveBeenCalled();
  });

  it('should handle error when loading data', () => {
    mockService.getDefineDonationProcedures.and.returnValue(
      throwError(() => new Error('API Error'))
    );

    component.loadData();

    expect(component.dataSource).toEqual([]);
    expect(component.tableConfig.pagination!.totalRecords).toBe(0);
    expect(component.isLoading).toBe(false);
  });

  it('should handle search', () => {
    const searchText = 'Standard Collection';
    mockService.getDefineDonationProcedures.and.returnValue(
      of({ data: [], totalRecords: 0 })
    );

    component.onSearch(searchText);

    expect(component.requestState.searchKeyword).toBe(searchText);
  });

  it('should handle page change', () => {
    mockService.getDefineDonationProcedures.and.returnValue(
      of({ data: [], totalRecords: 0 })
    );

    component.onPageChange({ pageIndex: 1, pageSize: 25, previousPageIndex: 0 });

    expect(component.tableConfig.pagination?.pageIndex).toBe(1);
  });

  it('should format date values correctly', () => {
    const date = moment().add(1, 'days').date(15).toDate();
    const formatted = component['formatDate'](date);
    const expectedYear = moment(date).year();
    const expectedMonth = moment(date).format('MMM').toUpperCase();
    expect(formatted).toContain('15');
    expect(formatted).toContain(expectedMonth);
    expect(formatted).toContain(expectedYear.toString());
  });

  it('should format date with null value', () => {
    expect(component['formatDate'](null)).toBe('-');
    expect(component['formatDate'](undefined)).toBe('-');
  });

  it('should format date from string', () => {
    const testDate = moment().add(1, 'days').date(15);
    const dateString = testDate.toISOString();
    const formatted = component['formatDate'](dateString);
    const expectedYear = testDate.year();
    const expectedMonth = testDate.format('MMM').toUpperCase();
    expect(formatted).toContain('15');
    expect(formatted).toContain(expectedMonth);
    expect(formatted).toContain(expectedYear.toString());
  });

  it('should handle empty search', () => {
    mockService.getDefineDonationProcedures.and.returnValue(
      of({ data: [], totalRecords: 0 })
    );

    component.onSearch('');

    expect(component.requestState.searchKeyword).toBeUndefined();
    expect(component.tableConfig.pagination?.pageIndex).toBe(0);
  });

  it('should reset to first page when searching', () => {
    mockService.getDefineDonationProcedures.and.returnValue(
      of({ data: [], totalRecords: 0 })
    );

    if (component.tableConfig.pagination) {
      component.tableConfig.pagination.pageIndex = 5;
    }

    component.onSearch('test');

    expect(component.tableConfig.pagination?.pageIndex).toBe(0);
  });

  describe('Sort functionality', () => {
    beforeEach(() => {
      mockService.getDefineDonationProcedures.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
    });

    it('should handle ascending sort', () => {
      component.onSortChange({ column: 'donationType', direction: 'A' });

      expect(component.requestState.sort).toBe('A');
      expect(component.tableConfig.sortConfig?.column).toBe('donationType');
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
    });

    it('should handle descending sort', () => {
      component.onSortChange({ column: 'donationType', direction: 'D' });

      expect(component.requestState.sort).toBe('D');
      expect(component.tableConfig.sortConfig?.column).toBe('donationType');
      expect(component.tableConfig.sortConfig?.direction).toBe('D');
    });

    it('should handle default sort (no sort)', () => {
      component.requestState.sort = 'A';
      component.onSortChange({ column: 'donationType', direction: 'default' });

      expect(component.requestState.sort).toBeUndefined();
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
    });

    it('should reload data when sort changes', () => {
      component.onSortChange({ column: 'procedureCode', direction: 'A' });
      expect(mockService.getDefineDonationProcedures).toHaveBeenCalled();
    });
  });

  describe('Row actions', () => {
    const mockRow = {
      donationType: 'WB',
      donationTypeDescription: 'Whole Blood',
      procedureCode: 'P001',
      procedureCodeDescription: 'Standard Collection',
      effectiveDate: new Date(),
      terminationDate: null
    };

    it('should handle edit action', () => {
      mockService.getDefineDonationProcedures.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();

      component.onRowAction({ action: 'edit', row: mockRow });

      expect(mockDialog.open).toHaveBeenCalled();
    });
  });

  describe('Dialog management', () => {
    it('should open dialog in add mode', () => {
      mockService.getDefineDonationProcedures.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();

      component.createRecord();

      expect(mockDialog.open).toHaveBeenCalledWith(jasmine.any(Function), jasmine.objectContaining({
        data: jasmine.objectContaining({
          mode: 'add',
          data: null
        })
      }));
    });

    it('should open dialog in edit mode', () => {
      mockService.getDefineDonationProcedures.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
      const mockRecord = {
        donationType: 'WB',
        donationTypeDescription: 'Whole Blood',
        procedureCode: 'P001',
        procedureCodeDescription: 'Standard Collection',
        effectiveDate: new Date(),
        terminationDate: null
      };

      component.editRecord(mockRecord);

      expect(mockDialog.open).toHaveBeenCalledWith(jasmine.any(Function), jasmine.objectContaining({
        data: jasmine.objectContaining({
          mode: 'edit',
          data: mockRecord
        })
      }));
    });

    it('should reload data when dialog closes with result', () => {
      mockDialog.open.and.returnValue({
        afterClosed: () => of(true)
      } as any);

      mockService.getDefineDonationProcedures.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      // Initialize component first
      component.ngOnInit();
      fixture.detectChanges();

      // Reset spy to start counting from here
      mockService.getDefineDonationProcedures.calls.reset();

      component.createRecord();

      expect(mockService.getDefineDonationProcedures).toHaveBeenCalledTimes(1);
    });

    it('should not reload data when dialog is cancelled', () => {
      mockDialog.open.and.returnValue({
        afterClosed: () => of(false)
      } as any);

      mockService.getDefineDonationProcedures.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      // Initialize component first
      component.ngOnInit();
      fixture.detectChanges();

      // Reset spy to start counting from here
      mockService.getDefineDonationProcedures.calls.reset();

      component.createRecord();

      expect(mockService.getDefineDonationProcedures).not.toHaveBeenCalled();
    });
  });

  describe('Filter functionality', () => {
    beforeEach(() => {
      mockService.getDefineDonationProcedures.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
    });

    it('should toggle filter panel', () => {
      component.isFilterOpen = false;
      component.toggleFilter();
      expect(component.isFilterOpen).toBe(true);

      component.toggleFilter();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should close filter panel', () => {
      component.isFilterOpen = true;
      component.closeFilter();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should apply filters and update request state', () => {
      const filters = {
        donationType: 'WB',
        procedureCode: 'P001',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.appliedFilters).toEqual(filters);
      expect(component.requestState.donationType).toBe('WB');
      expect(component.requestState.procedureCode).toBe('P001');
      expect(component.isFilterOpen).toBe(false);
    });

    it('should reset to first page when applying filters', () => {
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 5;
      }

      const filters = {
        donationType: 'WB',
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });

    it('should remove filter from request state when donation type is null', () => {
      component.requestState.donationType = 'WB';

      const filters = {
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestState.donationType).toBeUndefined();
    });

    it('should apply effective date filter with period', () => {
      const effectiveDate = moment().add(10, 'days').toDate();
      const expectedDateString = moment(effectiveDate).format('YYYY-MM-DD');
      const filters = {
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: 'after',
        effectiveDate: effectiveDate,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestState.effectiveDate).toBe(expectedDateString);
      expect(component.requestState.effectiveDatePeriod).toBe('after');
    });

    it('should apply termination date filter with period', () => {
      const terminationDate = moment().add(1, 'year').toDate();
      const expectedDateString = moment(terminationDate).format('YYYY-MM-DD');
      const filters = {
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: terminationDate
      };

      component.applyFilters(filters);

      expect(component.requestState.terminationDate).toBe(expectedDateString);
      expect(component.requestState.terminationDatePeriod).toBe('before');
    });

    it('should remove filter chip and update request state', () => {
      component.appliedFilters = {
        donationType: 'WB',
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.requestState.donationType = 'WB';

      component.removeFilterChip('donationType');

      expect(component.requestState.donationType).toBeUndefined();
    });

    it('should remove procedure code filter chip', () => {
      component.appliedFilters = {
        donationType: null,
        procedureCode: 'P001',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.requestState.procedureCode = 'P001';

      component.removeFilterChip('procedureCode');

      expect(component.requestState.procedureCode).toBeUndefined();
    });

    it('should remove effective date filter chip', () => {
      const effectiveDate = moment().add(10, 'days').toDate();
      const dateString = moment(effectiveDate).toISOString();
      component.appliedFilters = {
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: 'after',
        effectiveDate: effectiveDate,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.requestState.effectiveDate = dateString;
      component.requestState.effectiveDatePeriod = 'after';

      component.removeFilterChip('effectiveDate');

      expect(component.requestState.effectiveDate).toBeUndefined();
      expect(component.requestState.effectiveDatePeriod).toBeUndefined();
    });

    it('should remove termination date filter chip', () => {
      const terminationDate = moment().add(1, 'year').toDate();
      const dateString = moment(terminationDate).toISOString();
      component.appliedFilters = {
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: terminationDate
      };
      component.requestState.terminationDate = dateString;
      component.requestState.terminationDatePeriod = 'before';

      component.removeFilterChip('terminationDate');

      expect(component.requestState.terminationDate).toBeUndefined();
      expect(component.requestState.terminationDatePeriod).toBeUndefined();
    });

    it('should reset to first page when removing filter', () => {
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 5;
      }

      component.appliedFilters = {
        donationType: 'WB',
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.removeFilterChip('donationType');

      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });

    it('should clear all filters', () => {
      component.appliedFilters = {
        donationType: 'WB',
        procedureCode: 'P001',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.requestState.donationType = 'WB';
      component.requestState.procedureCode = 'P001';
      component.filterChips = [
        { key: 'donationType', label: 'Type: WB', value: 'WB' },
        { key: 'procedureCode', label: 'Code: P001', value: 'P001' }
      ];

      component.clearAllFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.requestState.donationType).toBeUndefined();
      expect(component.requestState.procedureCode).toBeUndefined();
    });

    it('should clear all date-related filters', () => {
      const effectiveDate = moment().add(10, 'days').toISOString();
      const terminationDate = moment().add(1, 'year').toISOString();
      component.requestState.effectiveDate = effectiveDate;
      component.requestState.effectiveDatePeriod = 'after';
      component.requestState.terminationDate = terminationDate;
      component.requestState.terminationDatePeriod = 'before';

      component.clearAllFilters();

      expect(component.requestState.effectiveDate).toBeUndefined();
      expect(component.requestState.effectiveDatePeriod).toBeUndefined();
      expect(component.requestState.terminationDate).toBeUndefined();
      expect(component.requestState.terminationDatePeriod).toBeUndefined();
    });

    it('should reset to first page when clearing filters', () => {
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 5;
      }

      component.clearAllFilters();

      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });

    it('should return true when filters are active', () => {
      component.appliedFilters = {
        donationType: 'WB',
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(component.hasActiveFilters).toBe(true);
    });

    it('should return false when no filters are active', () => {
      component.appliedFilters = null;

      expect(component.hasActiveFilters).toBe(false);
    });
  });

  describe('Keyboard shortcuts', () => {
    it('should create new record on Alt+C', () => {
      spyOn(component, 'createRecord');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });

      component.handleKeyboardShortcut(event);

      expect(component.createRecord).toHaveBeenCalled();
    });

    it('should focus search on Alt+S', () => {
      component.searchBarComponent = {
        focus: jasmine.createSpy('focus')
      } as any;

      const event = new KeyboardEvent('keydown', { altKey: true, key: 's' });

      component.handleKeyboardShortcut(event);

      expect(component.searchBarComponent.focus).toHaveBeenCalled();
    });

    it('should toggle filter on Alt+F', () => {
      spyOn(component, 'toggleFilter');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'f' });

      component.handleKeyboardShortcut(event);

      expect(component.toggleFilter).toHaveBeenCalled();
    });

    it('should close filter panel on Escape when open', () => {
      component.isFilterOpen = true;
      spyOn(component, 'closeFilter');

      const event = new KeyboardEvent('keydown', { key: 'Escape' });

      component.handleKeyboardShortcut(event);

      expect(component.closeFilter).toHaveBeenCalled();
    });

    it('should not close filter on Escape when closed', () => {
      component.isFilterOpen = false;
      spyOn(component, 'closeFilter');

      const event = new KeyboardEvent('keydown', { key: 'Escape' });

      component.handleKeyboardShortcut(event);

      expect(component.closeFilter).not.toHaveBeenCalled();
    });
  });

  describe('Component lifecycle', () => {
    it('should load data on ngOnInit', () => {
      mockService.getDefineDonationProcedures.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.ngOnInit();

      expect(mockService.getDefineDonationProcedures).toHaveBeenCalled();
    });

    it('should load filter dropdown values on ngOnInit', () => {
      mockService.getDefineDonationProcedures.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.ngOnInit();

      expect(mockService.getFilterDropdownValues).toHaveBeenCalled();
    });

    it('should unsubscribe on destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('Loading and error states', () => {
    it('should set loading state while fetching data', () => {
      mockService.getDefineDonationProcedures.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.loadData();

      expect(component.isLoading).toBe(false);
    });

    it('should update data source with response', () => {
      const mockData = {
        data: [
          {
            donationType: 'WB',
            donationTypeDescription: 'Whole Blood',
            procedureCode: 'P001',
            procedureCodeDescription: 'Standard Collection',
            effectiveDate: new Date(),
            terminationDate: null
          }
        ],
        totalRecords: 1
      };

      mockService.getDefineDonationProcedures.and.returnValue(of(mockData));

      component.loadData();

      expect(component.dataSource).toEqual(mockData.data);
      expect(component.tableConfig.pagination?.totalRecords).toBe(1);
    });

    it('should clear data on API failure', () => {
      mockService.getDefineDonationProcedures.and.returnValue(
        throwError(() => new Error('Network Error'))
      );

      component.loadData();

      expect(component.dataSource).toEqual([]);
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Filter dropdown values', () => {
    it('should populate donation types from service', () => {
      const mockFilterValues = {
        donationTypes: [
          { key: 'WB', value: 'Whole Blood' },
          { key: 'PL', value: 'Platelets' }
        ],
        procedureCodes: [
          { key: 'P001', value: 'Standard Collection' }
        ]
      };

      mockService.getFilterDropdownValues.and.returnValue(of(mockFilterValues));
      mockService.getDefineDonationProcedures.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.ngOnInit();

      expect(component.donationTypes.length).toBe(2);
      expect(component.donationTypes[0].key).toBe('WB');
    });

    it('should populate procedure codes from service', () => {
      const mockFilterValues = {
        donationTypes: [{ key: 'WB', value: 'Whole Blood' }],
        procedureCodes: [
          { key: 'P001', value: 'Standard Collection' },
          { key: 'P002', value: 'Apheresis Collection' }
        ]
      };

      mockService.getFilterDropdownValues.and.returnValue(of(mockFilterValues));
      mockService.getDefineDonationProcedures.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.ngOnInit();

      expect(component.procedureCodes.length).toBe(2);
      expect(component.procedureCodes[0].key).toBe('P001');
    });

    it('should handle error when loading filter values', () => {
      mockService.getFilterDropdownValues.and.returnValue(
        throwError(() => new Error('API Error'))
      );
      mockService.getDefineDonationProcedures.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.ngOnInit();

      expect(component.donationTypes).toEqual([]);
      expect(component.procedureCodes).toEqual([]);
    });
  });
});
