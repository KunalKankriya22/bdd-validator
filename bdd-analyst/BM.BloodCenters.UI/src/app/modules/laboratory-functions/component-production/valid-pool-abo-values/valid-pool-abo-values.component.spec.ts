import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError, Subject } from 'rxjs';
import { Overlay, OverlayModule } from '@angular/cdk/overlay';
import { TranslateModule } from '@ngx-translate/core';
import { signal } from '@angular/core';
import moment from 'moment';

import { ValidPoolAboValuesComponent } from './valid-pool-abo-values.component';
import { PoolAboValuesApiService } from './services/pool-abo-values-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  PoolAboValueTableModel,
  PoolAboValueFilterValue,
  PoolSldLookupDto,
  LookUpWithDescription
} from './models/pool-abo-values.model';

describe('ValidPoolAboValuesComponent', () => {
  let component: ValidPoolAboValuesComponent;
  let fixture: ComponentFixture<ValidPoolAboValuesComponent>;
  let mockService: jasmine.SpyObj<PoolAboValuesApiService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockMenuService: jasmine.SpyObj<MenuService>;

  const mockTableData: PoolAboValueTableModel[] = [
    {
      opos: 'Y',
      oneg: 'N',
      apos: 'Y',
      aneg: 'N',
      bpos: 'N',
      bneg: 'N',
      abpos: 'N',
      abneg: 'N',
      unitSchemeType: 'I',
      rhLabelFlag: 'Y',
      poolSld: 'AB01',
      poolSldDesc: 'ABO Group AB01',
      effDate: '01-Jan-2025',
      termDate: '31-Dec-2025',
      auditKey: 'AUDIT123'
    },
    {
      opos: 'Y',
      oneg: 'Y',
      apos: 'N',
      aneg: 'N',
      bpos: 'N',
      bneg: 'N',
      abpos: 'N',
      abneg: 'N',
      unitSchemeType: 'C',
      rhLabelFlag: 'N',
      poolSld: 'AB02',
      poolSldDesc: 'ABO Group AB02',
      effDate: '01-Feb-2025',
      termDate: '',
      auditKey: 'AUDIT456'
    }
  ];

  const mockPoolSldLookup: PoolSldLookupDto[] = [
    { aboLabel: 'AB01', aboShortName: 'ABO Group AB01' },
    { aboLabel: 'AB02', aboShortName: 'ABO Group AB02' }
  ];

  beforeEach(() => {

    const chapterChanged$ = new Subject<void>();

    mockService = jasmine.createSpyObj('PoolAboValuesApiService', [
      'getValidAboPooledSldList',
      'searchValidAboPooledSld',
      'getPoolSldLookup',
      'createValidAboPooledSld',
      'updateValidAboPooledSld'
    ]);
    mockLoggingService = jasmine.createSpyObj('LoggingService', ['log', 'error', 'warn', 'debug']);
    mockSnackbarService = createMockSnackbarService();
    mockHeaderService = createMockHeaderService();
    mockMenuService = jasmine.createSpyObj('MenuService', ['findMenuItemByPath', 'getMenuItemsSignal']);
    mockMenuService.getMenuItemsSignal.and.returnValue(signal([]));

    mockService.searchValidAboPooledSld.and.returnValue(of({ success: true, message: 'Success', statusCode: 200, data: mockTableData, total: 2 }));
    mockService.getPoolSldLookup.and.returnValue(of(mockPoolSldLookup));



      TestBed.configureTestingModule({
      imports: [
        ValidPoolAboValuesComponent,
        NoopAnimationsModule,
        OverlayModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: PoolAboValuesApiService, useValue: mockService },
        { provide: LoggingService, useValue: mockLoggingService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MenuService, useValue: mockMenuService },
        Overlay,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });





      mockService.getValidAboPooledSldList.calls.reset();


      mockService.searchValidAboPooledSld.calls.reset();


      mockService.getPoolSldLookup.calls.reset();


      mockService.createValidAboPooledSld.calls.reset();


      mockService.updateValidAboPooledSld.calls.reset();


      mockLoggingService.log.calls.reset();


      mockLoggingService.error.calls.reset();


      mockLoggingService.warn.calls.reset();


      mockLoggingService.debug.calls.reset();


      mockMenuService.findMenuItemByPath.calls.reset();


      mockMenuService.getMenuItemsSignal.calls.reset();


      mockMenuService.getMenuItemsSignal.and.returnValue(signal([]));


      mockService.searchValidAboPooledSld.and.returnValue(of({ success: true, message: 'Success', statusCode: 200, data: mockTableData, total: 2 }));


      mockService.getPoolSldLookup.and.returnValue(of(mockPoolSldLookup));


    fixture = TestBed.createComponent(ValidPoolAboValuesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit and initialization', () => {
    it('should call searchValidAboPooledSld on init (via loadData)', () => {
      // ngOnInit was already called via fixture.detectChanges() in beforeEach
      expect(mockService.searchValidAboPooledSld).toHaveBeenCalled();
    });

    it('should call getPoolSldLookup on init (via loadLookupOptions)', () => {
      expect(mockService.getPoolSldLookup).toHaveBeenCalled();
    });

    it('should populate poolSldOptions from lookup response', () => {
      expect(component.poolSldOptions.length).toBe(2);
      expect(component.poolSldOptions[0]).toEqual({ key: 'AB01', value: 'AB01', description: 'ABO Group AB01' });
      expect(component.poolSldOptions[1]).toEqual({ key: 'AB02', value: 'AB02', description: 'ABO Group AB02' });
    });

    it('should log error and show snackbar when loadLookupOptions fails', fakeAsync(() => {
      const error = new Error('Lookup API Error');
      mockService.getPoolSldLookup.and.returnValue(throwError(() => error));

      // Re-create component to trigger ngOnInit again
      fixture = TestBed.createComponent(ValidPoolAboValuesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(mockLoggingService.error).toHaveBeenCalledWith('Error loading Pool SLD lookup', error);
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load Pool SLD options');
    }));

    it('should initialize headerConfig with ADD NEW action', () => {
      expect(component.headerConfig.actions!.length).toBe(1);
      expect(component.headerConfig.actions![0].label).toBe('ADD NEW POOL ABO VALUE');
      expect(component.headerConfig.actions![0].icon).toBe('add');
    });

    it('should initialize searchConfig with placeholder', () => {
      expect(component.searchConfig.placeholder).toBe('Search by System Label decision');
      expect(component.searchConfig.minLength).toBe(1);
    });

    it('should initialize tableConfig with correct columns count', () => {
      expect(component.tableConfig.columns.length).toBe(14);
    });

    it('should initialize tableConfig with edit row action', () => {
      expect(component.tableConfig.rowActions!.length).toBe(1);
      expect(component.tableConfig.rowActions![0].action).toBe('edit');
    });

    it('should initialize tableConfig pagination defaults', () => {
      expect(component.tableConfig.pagination!.pageSize).toBe(25);
      expect(component.tableConfig.pagination!.showFirstLastButtons).toBeTrue();
    });

    it('should initialize sortConfig with poolNumber column', () => {
      expect(component.tableConfig.sortConfig!.column).toBe('poolNumber');
      expect(component.tableConfig.sortConfig!.direction).toBe('default');
    });
  });

  describe('subscribeToChapterChanges', () => {
    it('should close side panel, reload lookup options and reload data when chapter changes', fakeAsync(() => {
      const chapterSubject = new Subject<void>();
      (mockHeaderService as any).chapterChanged$ = chapterSubject.asObservable();

      // Re-create component with the subject-based chapterChanged$
      fixture = TestBed.createComponent(ValidPoolAboValuesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      // Open side panel first
      component.sidePanelOpen = true;
      component.sidePanelData = mockTableData[0];

      // Reset call counts after init
      mockService.searchValidAboPooledSld.calls.reset();
      mockService.getPoolSldLookup.calls.reset();

      // Emit chapter change
      chapterSubject.next();
      tick();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
      expect(mockService.getPoolSldLookup).toHaveBeenCalled();
      expect(mockService.searchValidAboPooledSld).toHaveBeenCalled();
    }));
  });

  describe('loadData', () => {
    it('should set isLoading to true at start and false on success', fakeAsync(() => {
      component.isLoading = false;
      component.loadData();
      // isLoading is set to true synchronously before the subscribe returns
      // Since the mock returns synchronously via of(), it will already be false after tick
      tick();
      expect(component.isLoading).toBeFalse();
    }));

    it('should set hasError to false at start of load', fakeAsync(() => {
      component.hasError = true;
      component.loadData();
      tick();
      expect(component.hasError).toBeFalse();
    }));

    it('should populate dataSource on success', fakeAsync(() => {
      component.loadData();
      tick();
      expect(component.dataSource).toEqual(mockTableData);
    }));

    it('should set dataSource to empty array when response data is null', fakeAsync(() => {
      mockService.searchValidAboPooledSld.and.returnValue(of({ success: true, message: 'Success', statusCode: 200, data: null as any, total: 0 }));
      component.loadData();
      tick();
      expect(component.dataSource).toEqual([]);
    }));

    it('should update pagination totalRecords on success', fakeAsync(() => {
      component.loadData();
      tick();
      expect(component.tableConfig.pagination!.totalRecords).toBe(2);
    }));

    it('should update pagination pageIndex and pageSize on success', fakeAsync(() => {
      component.currentPageIndex = 2;
      component.currentPageSize = 50;
      component.loadData();
      tick();
      expect(component.tableConfig.pagination!.pageIndex).toBe(2);
      expect(component.tableConfig.pagination!.pageSize).toBe(50);
    }));

    it('should set totalRecords to 0 when response total is undefined', fakeAsync(() => {
      mockService.searchValidAboPooledSld.and.returnValue(of({ success: true, message: 'Success', statusCode: 200, data: mockTableData } as any));
      component.loadData();
      tick();
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
    }));

    it('should calculate correct take and skip values', fakeAsync(() => {
      component.currentPageSize = 10;
      component.currentPageIndex = 3;
      component.loadData();
      tick();

      const callArgs = mockService.searchValidAboPooledSld.calls.mostRecent().args;
      expect(callArgs[0]).toBe(10); // take
      expect(callArgs[1]).toBe(30); // skip = 3 * 10
    }));

    it('should pass searchKeyword as poolSldDesc in request', fakeAsync(() => {
      component.searchKeyword = 'test keyword';
      component.loadData();
      tick();

      const callArgs = mockService.searchValidAboPooledSld.calls.mostRecent().args;
      expect(callArgs[2].poolSldDesc).toBe('test keyword');
    }));

    it('should pass sortDirection in request', fakeAsync(() => {
      component.sortDirection = 'DESC';
      component.loadData();
      tick();

      const callArgs = mockService.searchValidAboPooledSld.calls.mostRecent().args;
      expect(callArgs[2].sortDirection).toBe('DESC');
    }));



    it('should set hasError to true on error', fakeAsync(() => {
      mockService.searchValidAboPooledSld.and.returnValue(throwError(() => new Error('API Error')));

      component.loadData();
      tick();

      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
    }));

    it('should log error using LoggingService on error', fakeAsync(() => {
      const error = new Error('API Error');
      mockService.searchValidAboPooledSld.and.returnValue(throwError(() => error));

      component.loadData();
      tick();

      expect(mockLoggingService.error).toHaveBeenCalledWith(
        'Error loading valid pool ABO values',
        error
      );
    }));

    it('should set error message on error', fakeAsync(() => {
      mockService.searchValidAboPooledSld.and.returnValue(throwError(() => new Error('API Error')));

      component.loadData();
      tick();

      expect(component.errorMessage).toBe('Failed to load data. Please try again.');
    }));





    it('should include all filter fields in API request', fakeAsync(() => {
      component.appliedFilters = {
        opos: 'Y',
        oneg: 'N',
        apos: 'Y',
        aneg: 'N',
        bpos: 'Y',
        bneg: 'N',
        abpos: 'Y',
        abneg: 'N',
        effDatePeriod: 'after',
        effDate: '2025-01-01T00:00:00.000Z',
        termDatePeriod: 'before',
        termDate: '2025-12-31T00:00:00.000Z'
      };

      component.loadData();
      tick();

      const callArgs = mockService.searchValidAboPooledSld.calls.mostRecent().args;
      const request = callArgs[2];

      // Removed filters should be null
      expect(request.poolSld).toBeNull();
      expect(request.poolSldDesc).toBeNull();
      expect(request.unitSchemeType).toBeNull();
      expect(request.rhLabelFlag).toBeNull();

      // Blood type filters
      expect(request.opos).toBe('Y');
      expect(request.oneg).toBe('N');
      expect(request.apos).toBe('Y');
      expect(request.aneg).toBe('N');
      expect(request.bpos).toBe('Y');
      expect(request.bneg).toBe('N');
      expect(request.abpos).toBe('Y');
      expect(request.abneg).toBe('N');

      // Date filters
      expect(request.effDateFrom).toBe('2025-01-01T00:00:00.000Z');
      expect(request.effDateTo).toBeNull();
      expect(request.termDateFrom).toBeNull();
      expect(request.termDateTo).toBe('2025-12-31T00:00:00.000Z');
    }));

    it('should send null for blood type filters when not in appliedFilters', fakeAsync(() => {
      component.appliedFilters = {
        effDate: '2025-01-01T00:00:00.000Z',
        effDatePeriod: 'after'
      };

      component.loadData();
      tick();

      const callArgs = mockService.searchValidAboPooledSld.calls.mostRecent().args;
      const request = callArgs[2];

      expect(request.opos).toBeNull();
      expect(request.oneg).toBeNull();
      expect(request.apos).toBeNull();
      expect(request.aneg).toBeNull();
      expect(request.bpos).toBeNull();
      expect(request.bneg).toBeNull();
      expect(request.abpos).toBeNull();
      expect(request.abneg).toBeNull();
    }));

    it('should send null for date filters when not in appliedFilters', fakeAsync(() => {
      component.appliedFilters = {
        opos: 'Y'
      };

      component.loadData();
      tick();

      const callArgs = mockService.searchValidAboPooledSld.calls.mostRecent().args;
      const request = callArgs[2];

      expect(request.effDateFrom).toBeNull();
      expect(request.effDateTo).toBeNull();
      expect(request.termDateFrom).toBeNull();
      expect(request.termDateTo).toBeNull();
    }));
  });

  describe('onSearch', () => {
    it('should set searchKeyword', () => {
      component.onSearch('test search');
      expect(component.searchKeyword).toBe('test search');
    });

    it('should reset currentPageIndex to 0', () => {
      component.currentPageIndex = 5;
      component.onSearch('test');
      expect(component.currentPageIndex).toBe(0);
    });

    it('should reset pagination pageIndex to 0', () => {
      component.tableConfig.pagination!.pageIndex = 5;
      component.onSearch('test');
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should call loadData', fakeAsync(() => {
      spyOn(component, 'loadData');
      component.onSearch('test');
      expect(component.loadData).toHaveBeenCalled();
    }));





    it('should send poolSldDesc in API request', fakeAsync(() => {
      component.onSearch('test search');
      tick();

      const callArgs = mockService.searchValidAboPooledSld.calls.mostRecent().args;
      expect(callArgs[2].poolSldDesc).toBe('test search');
      expect(callArgs[2].searchItem).toBeNull();
    }));

    it('should send null poolSldDesc for empty string', fakeAsync(() => {
      component.onSearch('');
      tick();

      const callArgs = mockService.searchValidAboPooledSld.calls.mostRecent().args;
      expect(callArgs[2].poolSldDesc).toBeNull();
      expect(callArgs[2].searchItem).toBeNull();
    }));
  });
  describe('onPageChange', () => {
    it('should update currentPageIndex', () => {
      component.onPageChange({ pageIndex: 3, pageSize: 25 });
      expect(component.currentPageIndex).toBe(3);
    });

    it('should update currentPageSize', () => {
      component.onPageChange({ pageIndex: 0, pageSize: 50 });
      expect(component.currentPageSize).toBe(50);
    });

    it('should call loadData', fakeAsync(() => {
      spyOn(component, 'loadData');
      component.onPageChange({ pageIndex: 1, pageSize: 10 });
      expect(component.loadData).toHaveBeenCalled();
    }));
  });

  describe('onSortChange', () => {
    it('should set sortDirection to ASC when direction is A', fakeAsync(() => {
      component.onSortChange({ column: 'poolSld', direction: 'A' });
      tick();
      expect(component.sortDirection).toBe('ASC');
    }));

    it('should set sortDirection to DESC when direction is D', fakeAsync(() => {
      component.onSortChange({ column: 'poolSld', direction: 'D' });
      tick();
      expect(component.sortDirection).toBe('DESC');
    }));

    it('should set sortDirection to ASC for default/other direction', fakeAsync(() => {
      component.onSortChange({ column: 'poolSld', direction: 'default' });
      tick();
      expect(component.sortDirection).toBe('ASC');
    }));

    it('should update sortConfig column', fakeAsync(() => {
      component.onSortChange({ column: 'effDate', direction: 'A' });
      tick();
      expect(component.tableConfig.sortConfig!.column).toBe('effDate');
    }));

    it('should update sortConfig direction', fakeAsync(() => {
      component.onSortChange({ column: 'poolSld', direction: 'D' });
      tick();
      expect(component.tableConfig.sortConfig!.direction).toBe('D');
    }));

    it('should call loadData', fakeAsync(() => {
      spyOn(component, 'loadData');
      component.onSortChange({ column: 'poolSld', direction: 'A' });
      expect(component.loadData).toHaveBeenCalled();
    }));
  });

  describe('onRowAction', () => {
    it('should call openEditDialog when action is edit', () => {
      spyOn(component, 'openEditDialog');
      const row = mockTableData[0];

      component.onRowAction({ action: 'edit', row });

      expect(component.openEditDialog).toHaveBeenCalledWith(row);
    });

    it('should not call openEditDialog for unknown actions', () => {
      spyOn(component, 'openEditDialog');
      const row = mockTableData[0];

      component.onRowAction({ action: 'delete', row });

      expect(component.openEditDialog).not.toHaveBeenCalled();
    });
  });

  describe('applyFilters', () => {
    it('should set appliedFilters', () => {
      const filters: PoolAboValueFilterValue = {
        opos: 'Y',
        effDate: '2025-01-01T00:00:00.000Z',
        effDatePeriod: 'after'
      };

      component.applyFilters(filters);

      expect(component.appliedFilters).toEqual(filters);
    });

    it('should reset currentPageIndex to 0', () => {
      component.currentPageIndex = 3;
      component.applyFilters({ opos: 'Y' });
      expect(component.currentPageIndex).toBe(0);
    });

    it('should reset pagination pageIndex to 0', () => {
      component.tableConfig.pagination!.pageIndex = 3;
      component.applyFilters({ opos: 'Y' });
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should call loadData', fakeAsync(() => {
      spyOn(component, 'loadData');
      component.applyFilters({ opos: 'Y' });
      expect(component.loadData).toHaveBeenCalled();
    }));





    it('should generate filter chips', () => {
      const filters: PoolAboValueFilterValue = {
        opos: 'Y',
        oneg: 'N'
      };

      component.applyFilters(filters);

      expect(component.filterChips.length).toBe(2);
    });

    it('should send multiple filters in API request', fakeAsync(() => {
      const filters: PoolAboValueFilterValue = {
        opos: 'Y',
        apos: 'Y',
        bpos: 'N'
      };

      component.applyFilters(filters);
      tick();

      const callArgs = mockService.searchValidAboPooledSld.calls.mostRecent().args;
      expect(callArgs[2].opos).toBe('Y');
      expect(callArgs[2].apos).toBe('Y');
      expect(callArgs[2].bpos).toBe('N');
    }));

    it('should send blood type filters in API request', fakeAsync(() => {
      const filters: PoolAboValueFilterValue = {
        opos: 'Y',
        oneg: 'N',
        apos: 'Y',
        aneg: 'N',
        bpos: 'Y',
        bneg: 'N',
        abpos: 'Y',
        abneg: 'N'
      };

      component.applyFilters(filters);
      tick();

      const callArgs = mockService.searchValidAboPooledSld.calls.mostRecent().args;
      expect(callArgs[2].opos).toBe('Y');
      expect(callArgs[2].oneg).toBe('N');
      expect(callArgs[2].apos).toBe('Y');
      expect(callArgs[2].aneg).toBe('N');
      expect(callArgs[2].bpos).toBe('Y');
      expect(callArgs[2].bneg).toBe('N');
      expect(callArgs[2].abpos).toBe('Y');
      expect(callArgs[2].abneg).toBe('N');
    }));

    it('should send effDateTo when effDatePeriod is "before"', fakeAsync(() => {
      const filters: PoolAboValueFilterValue = {
        effDatePeriod: 'before',
        effDate: '2025-01-15T00:00:00.000Z'
      };

      component.applyFilters(filters);
      tick();

      const callArgs = mockService.searchValidAboPooledSld.calls.mostRecent().args;
      expect(callArgs[2].effDateTo).toBe('2025-01-15T00:00:00.000Z');
      expect(callArgs[2].effDateFrom).toBeNull();
    }));

    it('should send effDateFrom when effDatePeriod is "after"', fakeAsync(() => {
      const filters: PoolAboValueFilterValue = {
        effDatePeriod: 'after',
        effDate: '2025-01-15T00:00:00.000Z'
      };

      component.applyFilters(filters);
      tick();

      const callArgs = mockService.searchValidAboPooledSld.calls.mostRecent().args;
      expect(callArgs[2].effDateFrom).toBe('2025-01-15T00:00:00.000Z');
      expect(callArgs[2].effDateTo).toBeNull();
    }));

    it('should send termDateTo when termDatePeriod is "before"', fakeAsync(() => {
      const filters: PoolAboValueFilterValue = {
        termDatePeriod: 'before',
        termDate: '2025-12-31T00:00:00.000Z'
      };

      component.applyFilters(filters);
      tick();

      const callArgs = mockService.searchValidAboPooledSld.calls.mostRecent().args;
      expect(callArgs[2].termDateTo).toBe('2025-12-31T00:00:00.000Z');
      expect(callArgs[2].termDateFrom).toBeNull();
    }));

    it('should send termDateFrom when termDatePeriod is "after"', fakeAsync(() => {
      const filters: PoolAboValueFilterValue = {
        termDatePeriod: 'after',
        termDate: '2025-12-31T00:00:00.000Z'
      };

      component.applyFilters(filters);
      tick();

      const callArgs = mockService.searchValidAboPooledSld.calls.mostRecent().args;
      expect(callArgs[2].termDateFrom).toBe('2025-12-31T00:00:00.000Z');
      expect(callArgs[2].termDateTo).toBeNull();
    }));

    it('should send all filter types together in API request', fakeAsync(() => {
      const filters: PoolAboValueFilterValue = {
        opos: 'Y',
        oneg: 'N',
        apos: 'Y',
        effDatePeriod: 'after',
        effDate: '2025-01-01T00:00:00.000Z',
        termDatePeriod: 'before',
        termDate: '2025-12-31T00:00:00.000Z'
      };

      component.applyFilters(filters);
      tick();

      const callArgs = mockService.searchValidAboPooledSld.calls.mostRecent().args;
      expect(callArgs[2].opos).toBe('Y');
      expect(callArgs[2].oneg).toBe('N');
      expect(callArgs[2].apos).toBe('Y');
      expect(callArgs[2].effDateFrom).toBe('2025-01-01T00:00:00.000Z');
      expect(callArgs[2].termDateTo).toBe('2025-12-31T00:00:00.000Z');
    }));

    it('should not send date filters when period is not set', fakeAsync(() => {
      const filters: PoolAboValueFilterValue = {
        effDate: '2025-01-15T00:00:00.000Z',
        termDate: '2025-12-31T00:00:00.000Z'
      };

      component.applyFilters(filters);
      tick();

      const callArgs = mockService.searchValidAboPooledSld.calls.mostRecent().args;
      expect(callArgs[2].effDateFrom).toBeNull();
      expect(callArgs[2].effDateTo).toBeNull();
      expect(callArgs[2].termDateFrom).toBeNull();
      expect(callArgs[2].termDateTo).toBeNull();
    }));
  });

  describe('onRemoveFilterChip', () => {
    it('should update appliedFilters when chip is removed', () => {
      component.appliedFilters = {
        opos: 'Y',
        apos: 'N'
      };

      component.onRemoveFilterChip('opos');

      expect(component.appliedFilters?.opos).toBeUndefined();
      expect(component.appliedFilters?.apos).toBe('N');
    });

    it('should update filterChips after removal', () => {
      component.appliedFilters = {
        opos: 'Y',
        apos: 'N'
      };

      component.onRemoveFilterChip('opos');

      // Only apos chip should remain
      expect(component.filterChips.length).toBe(1);
    });

    it('should reset currentPageIndex to 0', () => {
      component.appliedFilters = { opos: 'Y' };
      component.currentPageIndex = 5;

      component.onRemoveFilterChip('opos');

      expect(component.currentPageIndex).toBe(0);
    });

    it('should reset pagination pageIndex to 0', () => {
      component.appliedFilters = { opos: 'Y' };
      component.tableConfig.pagination!.pageIndex = 5;

      component.onRemoveFilterChip('opos');

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should call loadData', fakeAsync(() => {
      component.appliedFilters = { opos: 'Y' };
      spyOn(component, 'loadData');

      component.onRemoveFilterChip('opos');

      expect(component.loadData).toHaveBeenCalled();
    }));

    it('should set appliedFilters to null when last filter removed', () => {
      component.appliedFilters = { opos: 'Y' };

      component.onRemoveFilterChip('opos');

      expect(component.appliedFilters).toBeNull();
    });



  });
  describe('openAddDialog', () => {
    it('should set sidePanelMode to add', () => {
      component.openAddDialog();
      expect(component.sidePanelMode).toBe('add');
    });

    it('should set sidePanelData to null', () => {
      component.sidePanelData = mockTableData[0];
      component.openAddDialog();
      expect(component.sidePanelData).toBeNull();
    });

    it('should set sidePanelOpen to true', () => {
      component.sidePanelOpen = false;
      component.openAddDialog();
      expect(component.sidePanelOpen).toBeTrue();
    });
  });

  describe('openEditDialog', () => {
    it('should set sidePanelMode to edit', () => {
      const row = mockTableData[0];
      component.openEditDialog(row);
      expect(component.sidePanelMode).toBe('edit');
    });

    it('should set sidePanelData to row', () => {
      const row = mockTableData[0];
      component.openEditDialog(row);

      expect(component.sidePanelData).toBe(row);
    });

    it('should set sidePanelOpen to true', () => {
      component.sidePanelOpen = false;
      component.openEditDialog(mockTableData[0]);
      expect(component.sidePanelOpen).toBeTrue();
    });
  });

  describe('closeSidePanel', () => {
    it('should set sidePanelOpen to false', () => {
      component.sidePanelOpen = true;
      component.closeSidePanel();

      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should set sidePanelData to null', () => {
      component.sidePanelData = mockTableData[0];
      component.closeSidePanel();
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when appliedFilters is null', () => {
      component.appliedFilters = null;
      expect(component.hasActiveFilters()).toBeFalse();
    });

    it('should return true when filters are present', () => {
      component.appliedFilters = { opos: 'Y' };
      expect(component.hasActiveFilters()).toBeTrue();
    });

    it('should return false when all filter values are null/undefined', () => {
      component.appliedFilters = { opos: null };
      expect(component.hasActiveFilters()).toBeFalse();
    });
  });

  describe('clearAllFilters', () => {
    it('should set appliedFilters to null', () => {
      component.appliedFilters = { opos: 'Y' };
      component.clearAllFilters();
      expect(component.appliedFilters).toBeNull();
    });

    it('should clear filterChips', () => {
      component.filterChips = [{ key: 'opos', label: 'O Pos: Yes', value: 'Y' }];
      component.clearAllFilters();
      expect(component.filterChips).toEqual([]);
    });

    it('should clear searchKeyword', () => {
      component.searchKeyword = 'test';
      component.clearAllFilters();
      expect(component.searchKeyword).toBe('');
    });

    it('should call clearSearch on searchBarComponent if available', () => {
      const mockSearchBar = { clearSearch: jasmine.createSpy('clearSearch'), focus: jasmine.createSpy('focus') };
      (component as any).searchBarComponent = mockSearchBar;

      component.clearAllFilters();

      expect(mockSearchBar.clearSearch).toHaveBeenCalled();
    });

    it('should not throw if searchBarComponent is undefined', () => {
      (component as any).searchBarComponent = undefined;
      expect(() => component.clearAllFilters()).not.toThrow();
    });

    it('should reset currentPageIndex to 0', () => {
      component.currentPageIndex = 5;
      component.clearAllFilters();
      expect(component.currentPageIndex).toBe(0);
    });

    it('should reset pagination pageIndex to 0', () => {
      component.tableConfig.pagination!.pageIndex = 5;
      component.clearAllFilters();
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should call loadData', fakeAsync(() => {
      spyOn(component, 'loadData');
      component.clearAllFilters();
      expect(component.loadData).toHaveBeenCalled();
    }));
  });

  describe('onSave', () => {
    const formValue = {
      opos: 'Y',
      oneg: 'N',
      apos: 'Y',
      aneg: 'N',
      bpos: 'N',
      bneg: 'N',
      abpos: 'N',
      abneg: 'N',
      unitSchemeType: 'I',
      rhLabelFlag: 'Y',
      poolSld: 'AB03',
      poolSldDesc: 'New Group',
      effDate: moment('01-MAR-2025', 'DD-MMM-YYYY'),
      termDate: null
    };

    it('should call createValidAboPooledSld when mode is add', fakeAsync(() => {
      component.sidePanelMode = 'add';
      mockService.createValidAboPooledSld.and.returnValue(of({ success: true, message: 'Created', statusCode: 201, data: {} as any }));

      component.onSave(formValue);
      tick();

      expect(mockService.createValidAboPooledSld).toHaveBeenCalled();
    }));

    it('should call updateValidAboPooledSld when mode is edit', fakeAsync(() => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockTableData[0];
      mockService.updateValidAboPooledSld.and.returnValue(of({ success: true, message: 'Updated', statusCode: 200, data: {} as any }));

      component.onSave(formValue);
      tick();

      expect(mockService.updateValidAboPooledSld).toHaveBeenCalledWith(mockTableData[0].auditKey, jasmine.any(Object));
    }));
  });

  describe('onSaveAndCreateAnother', () => {
    const formValue = {
      opos: 'Y',
      oneg: 'N',
      apos: 'Y',
      aneg: 'N',
      bpos: 'N',
      bneg: 'N',
      abpos: 'N',
      abneg: 'N',
      unitSchemeType: 'I',
      rhLabelFlag: 'Y',
      poolSld: 'AB03',
      poolSldDesc: 'New Group',
      effDate: moment('01-MAR-2025', 'DD-MMM-YYYY'),
      termDate: null
    };

    it('should keep side panel open after successful add', fakeAsync(() => {
      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;
      mockService.createValidAboPooledSld.and.returnValue(of({ success: true, message: 'Created', statusCode: 201, data: {} as any }));

      component.onSaveAndCreateAnother(formValue);
      tick();

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    }));

    it('should show success snackbar after successful add', fakeAsync(() => {
      component.sidePanelMode = 'add';
      mockService.createValidAboPooledSld.and.returnValue(of({ success: true, message: 'Created', statusCode: 201, data: {} as any }));

      component.onSaveAndCreateAnother(formValue);
      tick();

      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Valid ABO Pooled SLD record has been successfully added.');
    }));

    it('should reload data after successful add', fakeAsync(() => {
      component.sidePanelMode = 'add';
      mockService.createValidAboPooledSld.and.returnValue(of({ success: true, message: 'Created', statusCode: 201, data: {} as any }));

      const loadDataSpy = spyOn(component, 'loadData');
      component.onSaveAndCreateAnother(formValue);
      tick();

      expect(loadDataSpy).toHaveBeenCalled();
    }));
  });

  describe('handleAdd (via onSave)', () => {
    const formValue = {
      opos: 'Y',
      oneg: 'N',
      apos: 'Y',
      aneg: 'N',
      bpos: 'N',
      bneg: 'N',
      abpos: 'N',
      abneg: 'N',
      unitSchemeType: 'I',
      rhLabelFlag: 'Y',
      poolSld: 'AB03',
      poolSldDesc: 'New Group',
      effDate: moment('01-MAR-2025', 'DD-MMM-YYYY'),
      termDate: null
    };

    it('should close side panel on successful add (createAnother=false)', fakeAsync(() => {
      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;
      mockService.createValidAboPooledSld.and.returnValue(of({ success: true, message: 'Created', statusCode: 201, data: {} as any }));

      component.onSave(formValue);
      tick();

      expect(component.sidePanelOpen).toBeFalse();
    }));

    it('should show error.error.message when errorResponse is missing', fakeAsync(() => {
      component.sidePanelMode = 'add';
      const errorResponse = { error: { message: 'Validation failed' } };
      mockService.createValidAboPooledSld.and.returnValue(throwError(() => errorResponse));

      component.onSave(formValue);
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Validation failed');
    }));

    it('should show default error message when no specific error info', fakeAsync(() => {
      component.sidePanelMode = 'add';
      const errorResponse = { error: {} };
      mockService.createValidAboPooledSld.and.returnValue(throwError(() => errorResponse));

      component.onSave(formValue);
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to add record. Please try again.');
    }));
  });

  describe('handleUpdate (via onSave in edit mode)', () => {
    const formValue = {
      opos: 'Y',
      oneg: 'N',
      apos: 'Y',
      aneg: 'N',
      bpos: 'N',
      bneg: 'N',
      abpos: 'N',
      abneg: 'N',
      unitSchemeType: 'I',
      rhLabelFlag: 'Y',
      poolSld: 'AB01',
      poolSldDesc: 'ABO Group AB01',
      effDate: moment('01-JAN-2025', 'DD-MMM-YYYY'),
      termDate: moment('31-DEC-2026', 'DD-MMM-YYYY')
    };

    it('should return early and not call service when sidePanelData is null', fakeAsync(() => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = null;

      component.onSave(formValue);
      tick();

      expect(mockService.updateValidAboPooledSld).not.toHaveBeenCalled();
    }));

    it('should close side panel on successful update', fakeAsync(() => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockTableData[0];
      component.sidePanelOpen = true;
      mockService.updateValidAboPooledSld.and.returnValue(of({ success: true, message: 'Updated', statusCode: 200, data: {} as any }));

      component.onSave(formValue);
      tick();

      expect(component.sidePanelOpen).toBeFalse();
    }));

    it('should show error.error.message when errorResponse is missing', fakeAsync(() => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockTableData[0];
      const errorResponse = { error: { message: 'Concurrency error' } };
      mockService.updateValidAboPooledSld.and.returnValue(throwError(() => errorResponse));

      component.onSave(formValue);
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Concurrency error');
    }));

    it('should show default error message when no specific error info', fakeAsync(() => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockTableData[0];
      const errorResponse = { error: {} };
      mockService.updateValidAboPooledSld.and.returnValue(throwError(() => errorResponse));

      component.onSave(formValue);
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to update record. Please try again.');
    }));

    it('should pass auditKey from sidePanelData to update service', fakeAsync(() => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockTableData[0];
      mockService.updateValidAboPooledSld.and.returnValue(of({ success: true, message: 'Updated', statusCode: 200, data: {} as any }));

      component.onSave(formValue);
      tick();

      expect(mockService.updateValidAboPooledSld).toHaveBeenCalledWith('AUDIT123', jasmine.any(Object));
    }));

    it('should include poolSldDesc in update payload', fakeAsync(() => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockTableData[0];
      mockService.updateValidAboPooledSld.and.returnValue(of({ success: true, message: 'Updated', statusCode: 200, data: {} as any }));

      component.onSave(formValue);
      tick();

      const payload = mockService.updateValidAboPooledSld.calls.mostRecent().args[1];
      expect(payload.poolSldDesc).toBe('ABO Group AB01');
    }));
  });

  describe('handleKeyboardShortcut', () => {
    it('should focus search bar on Alt+S', () => {
      const mockSearchBar = { focus: jasmine.createSpy('focus'), clearSearch: jasmine.createSpy('clearSearch') };
      (component as any).searchBarComponent = mockSearchBar;

      const event = new KeyboardEvent('keydown', { altKey: true, key: 's' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockSearchBar.focus).toHaveBeenCalled();
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
      // Set up a mock overlayRef
      (component as any).overlayRef = { dispose: jasmine.createSpy('dispose') };

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should close side panel on Escape when sidePanelOpen is true', () => {
      component.sidePanelOpen = true;
      (component as any).overlayRef = null;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should not prevent default for non-shortcut keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should handle uppercase Alt+S', () => {
      const mockSearchBar = { focus: jasmine.createSpy('focus'), clearSearch: jasmine.createSpy('clearSearch') };
      (component as any).searchBarComponent = mockSearchBar;

      const event = new KeyboardEvent('keydown', { altKey: true, key: 'S' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(mockSearchBar.focus).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should dispose overlayRef if it exists', () => {
      const mockOverlay = { dispose: jasmine.createSpy('dispose') };
      (component as any).overlayRef = mockOverlay;

      component.ngOnDestroy();

      expect(mockOverlay.dispose).toHaveBeenCalled();
    });

    it('should not throw if overlayRef is null', () => {
      (component as any).overlayRef = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('openFilter', () => {
    it('should set isFilterOpen to true when no overlay exists', () => {
      (component as any).overlayRef = null;
      // We need a tableCard for the overlay to attach to
      (component as any).tableCard = { nativeElement: document.createElement('div') };
      component.openFilter();
      // After opening, isFilterOpen should be true (even if overlay creation fails the flag is set first)
      expect(component.isFilterOpen).toBeTrue();
    });

    it('should close existing overlay if already open', () => {
      const mockOverlayRef = { dispose: jasmine.createSpy('dispose'), backdropClick: jasmine.createSpy('backdropClick').and.returnValue(of()) };
      (component as any).overlayRef = mockOverlayRef;

      component.openFilter();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component.isFilterOpen).toBeFalse();
    });
  });

  describe('server-side filtering', () => {
    it('should send both search and filters in API request', fakeAsync(() => {
      component.applyFilters({ opos: 'Y' });
      tick();

      component.onSearch('AB');
      tick();

      const callArgs = mockService.searchValidAboPooledSld.calls.mostRecent().args;
      expect(callArgs[2].poolSldDesc).toBe('AB');
      expect(callArgs[2].searchItem).toBeNull();
      expect(callArgs[2].opos).toBe('Y');
    }));

    it('should maintain filters when search is cleared', fakeAsync(() => {
      component.applyFilters({ opos: 'Y' });
      tick();

      component.onSearch('AB01');
      tick();

      component.onSearch('');
      tick();

      const callArgs = mockService.searchValidAboPooledSld.calls.mostRecent().args;
      expect(callArgs[2].poolSldDesc).toBeNull();
      expect(callArgs[2].searchItem).toBeNull();
      expect(callArgs[2].opos).toBe('Y'); // Filter should still be applied
    }));
  });
  describe('Add Record Error Handling', () => {
    beforeEach(() => {
      component.sidePanelMode = 'add';
      component.sidePanelData = null;
      component.poolSldOptions = mockPoolSldLookup.map(item => ({
        key: item.aboLabel,
        value: item.aboLabel,
        description: item.aboShortName
      }));
      fixture.detectChanges();
    });

    it('should call resetSubmittingState on addEditComponent when save fails (via finalize)', fakeAsync(() => {
      const newRecord = {
        opos: 'Y',
        oneg: 'N',
        apos: 'Y',
        aneg: 'N',
        bpos: 'N',
        bneg: 'N',
        abpos: 'N',
        abneg: 'N',
        unitSchemeType: 'I',
        rhLabelFlag: 'Y',
        poolSld: 'AB03',
        poolSldDesc: 'New ABO Group',
        effDate: moment('01-MAR-2025', 'DD-MMM-YYYY'),
        termDate: null,
        auditKey: ''
      };

      // Mock error response
      const errorResponse = {
        error: {
          errorResponse: {
            error: 'Database connection failed'
          }
        }
      };
      mockService.createValidAboPooledSld.and.returnValue(throwError(() => errorResponse));

      // Mock addEditComponent with spy
      const mockAddEditComponent = {
        resetSubmittingState: jasmine.createSpy('resetSubmittingState')
      };
      component['addEditComponent'] = mockAddEditComponent as any;

      // Trigger save
      component.onSave(newRecord);
      tick();

      // Verify error was shown
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Database connection failed');

      // Verify resetSubmittingState was called via finalize (runs on error)
      expect(mockAddEditComponent.resetSubmittingState).toHaveBeenCalled();
    }));



    it('should not fail if addEditComponent is undefined', fakeAsync(() => {
      const newRecord = {
        opos: 'Y',
        oneg: 'N',
        apos: 'Y',
        aneg: 'N',
        bpos: 'N',
        bneg: 'N',
        abpos: 'N',
        abneg: 'N',
        unitSchemeType: 'I',
        rhLabelFlag: 'Y',
        poolSld: 'AB03',
        poolSldDesc: 'New ABO Group',
        effDate: moment('01-MAR-2025', 'DD-MMM-YYYY'),
        termDate: null,
        auditKey: ''
      };

      mockService.createValidAboPooledSld.and.returnValue(throwError(() => ({ error: {} })));
      component['addEditComponent'] = undefined;

      // Should not throw error
      expect(() => {
        component.onSave(newRecord);
        tick();
      }).not.toThrow();

      expect(mockSnackbarService.showError).toHaveBeenCalled();
    }));

    it('should call resetSubmittingState on addEditComponent when save succeeds (via finalize)', fakeAsync(() => {
      const newRecord = {
        opos: 'Y',
        oneg: 'N',
        apos: 'Y',
        aneg: 'N',
        bpos: 'N',
        bneg: 'N',
        abpos: 'N',
        abneg: 'N',
        unitSchemeType: 'I',
        rhLabelFlag: 'Y',
        poolSld: 'AB03',
        poolSldDesc: 'New ABO Group',
        effDate: moment('01-MAR-2025', 'DD-MMM-YYYY'),
        termDate: null,
        auditKey: ''
      };

      // Mock success response with data property
      mockService.createValidAboPooledSld.and.returnValue(of({
        success: true,
        message: 'Created',
        statusCode: 201,
        data: { auditKey: 'NEW123' } as any
      }));

      // Mock addEditComponent with spy
      const mockAddEditComponent = {
        resetSubmittingState: jasmine.createSpy('resetSubmittingState')
      };
      component['addEditComponent'] = mockAddEditComponent as any;

      // Trigger save
      component.onSave(newRecord);
      tick();

      // Verify success message shown
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Valid ABO Pooled SLD record has been successfully added.');

      // Verify resetSubmittingState was called via finalize (runs on success too)
      expect(mockAddEditComponent.resetSubmittingState).toHaveBeenCalled();
    }));
  });

  describe('Update Record Error Handling', () => {
    beforeEach(() => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockTableData[0];
      component.poolSldOptions = mockPoolSldLookup.map(item => ({
        key: item.aboLabel,
        value: item.aboLabel,
        description: item.aboShortName
      }));
      fixture.detectChanges();
    });

    it('should call resetSubmittingState on addEditComponent when update fails (via finalize)', fakeAsync(() => {
      const updatedRecord = {
        opos: mockTableData[0].opos,
        oneg: mockTableData[0].oneg,
        apos: mockTableData[0].apos,
        aneg: mockTableData[0].aneg,
        bpos: mockTableData[0].bpos,
        bneg: mockTableData[0].bneg,
        abpos: mockTableData[0].abpos,
        abneg: mockTableData[0].abneg,
        unitSchemeType: mockTableData[0].unitSchemeType,
        rhLabelFlag: mockTableData[0].rhLabelFlag,
        poolSld: mockTableData[0].poolSld,
        poolSldDesc: mockTableData[0].poolSldDesc,
        effDate: moment(mockTableData[0].effDate, 'DD-MMM-YYYY'),
        termDate: moment('31-DEC-2026', 'DD-MMM-YYYY'),
        auditKey: mockTableData[0].auditKey
      };

      const errorResponse = {
        error: {
          errorResponse: {
            error: 'Record locked by another user'
          }
        }
      };
      mockService.updateValidAboPooledSld.and.returnValue(throwError(() => errorResponse));

      const mockAddEditComponent = {
        resetSubmittingState: jasmine.createSpy('resetSubmittingState')
      };
      component['addEditComponent'] = mockAddEditComponent as any;

      component.onSave(updatedRecord);
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Record locked by another user');
      // resetSubmittingState called via finalize (runs on error)
      expect(mockAddEditComponent.resetSubmittingState).toHaveBeenCalled();
    }));



    it('should call resetSubmittingState on addEditComponent when update succeeds (via finalize)', fakeAsync(() => {
      const updatedRecord = {
        opos: mockTableData[0].opos,
        oneg: mockTableData[0].oneg,
        apos: mockTableData[0].apos,
        aneg: mockTableData[0].aneg,
        bpos: mockTableData[0].bpos,
        bneg: mockTableData[0].bneg,
        abpos: mockTableData[0].abpos,
        abneg: mockTableData[0].abneg,
        unitSchemeType: mockTableData[0].unitSchemeType,
        rhLabelFlag: mockTableData[0].rhLabelFlag,
        poolSld: mockTableData[0].poolSld,
        poolSldDesc: mockTableData[0].poolSldDesc,
        effDate: moment(mockTableData[0].effDate, 'DD-MMM-YYYY'),
        termDate: moment('31-DEC-2026', 'DD-MMM-YYYY'),
        auditKey: mockTableData[0].auditKey
      };

      // Mock success response
      mockService.updateValidAboPooledSld.and.returnValue(of({
        success: true,
        message: 'Updated',
        statusCode: 200,
        data: { auditKey: mockTableData[0].auditKey } as any
      }));

      const mockAddEditComponent = {
        resetSubmittingState: jasmine.createSpy('resetSubmittingState')
      };
      component['addEditComponent'] = mockAddEditComponent as any;

      component.onSave(updatedRecord);
      tick();

      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Valid ABO Pooled SLD record has been successfully updated.');
      // resetSubmittingState called via finalize (runs on success too)
      expect(mockAddEditComponent.resetSubmittingState).toHaveBeenCalled();
    }));
  });
});
