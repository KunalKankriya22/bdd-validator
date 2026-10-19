import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ValidRemoteTestingLabsComponent } from './valid-remote-testing-labs.component';
import { ValidRemoteTestingLabsApiService } from './services/valid-remote-testing-labs-api.service';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { provideRouter } from '@angular/router';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ValidRemoteTestingLabsComponent', () => {
  let component: ValidRemoteTestingLabsComponent;
  let fixture: ComponentFixture<ValidRemoteTestingLabsComponent>;
  let serviceSpy: jasmine.SpyObj<ValidRemoteTestingLabsApiService>;
  let headerServiceSpy: any;
  let menuServiceSpy: jasmine.SpyObj<MenuService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let chapterChanged$: Subject<void>;
  let router: Router;

  const mockLabs = [
    {
      testingLabId: 'LAB001',
      chapterId: '0001',
      testingLabName: 'Test Lab 1',
      contractId: 'C001',
      cliaNumber: '12D3456789',
      effDate: '2024-01-01',
      termDate: null,
    },
  ];

  const mockResponse = { data: mockLabs, totalCount: 1 };

  beforeEach(() => {
    chapterChanged$ = new Subject<void>();

    serviceSpy = jasmine.createSpyObj('ValidRemoteTestingLabsApiService', ['getAll']);
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);
    snackbarServiceSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });
    menuServiceSpy = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);
    menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([]));

    serviceSpy.getAll.and.returnValue(of(mockResponse));



      TestBed.configureTestingModule({
      imports: [ValidRemoteTestingLabsComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: ValidRemoteTestingLabsApiService, useValue: serviceSpy },
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MenuService, useValue: menuServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
      ],
    });





      serviceSpy.getAll.calls.reset();


      apiServiceSpy.get.calls.reset();


      apiServiceSpy.post.calls.reset();


      apiServiceSpy.put.calls.reset();


      apiServiceSpy.delete.calls.reset();


      menuServiceSpy.getMenuItemsSignal.calls.reset();


      menuServiceSpy.findMenuItemByPath.calls.reset();


      menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([]));


      serviceSpy.getAll.and.returnValue(of(mockResponse));


    fixture = TestBed.createComponent(ValidRemoteTestingLabsComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();


    });


  it('should load data on init', () => {
    expect(serviceSpy.getAll).toHaveBeenCalled();
    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].testingLabId).toBe('LAB001');
  });

  it('should set isLoading to false after data loads', () => {
    expect(component.isLoading).toBeFalse();
  });

  it('should update totalRecords in pagination config', () => {
    expect(component.tableConfig.pagination?.totalRecords).toBe(1);
  });

  describe('onSearch', () => {
    it('should update searchText and reload data', () => {
      component.onSearch('LAB001');
      expect(component.searchText).toBe('LAB001');
      expect(serviceSpy.getAll).toHaveBeenCalledTimes(2);
    });

    it('should reset pageIndex to 0', () => {
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 3;
      }
      component.onSearch('test');
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  describe('onPageChange', () => {
    it('should update pagination config and reload data', () => {
      serviceSpy.getAll.calls.reset();
      component.onPageChange({ pageIndex: 2, pageSize: 50 } as any);
      expect(component.tableConfig.pagination?.pageIndex).toBe(2);
      expect(component.tableConfig.pagination?.pageSize).toBe(50);
      expect(serviceSpy.getAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('onSortChange', () => {
    it('should cycle: default → A on same column', () => {
      if (component.tableConfig.sortConfig) {
        component.tableConfig.sortConfig.direction = 'default';
        component.tableConfig.sortConfig.column = 'testingLabId';
      }
      component.onSortChange({ column: 'testingLabId', direction: 'A' } as any);
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
    });

    it('should cycle: A → D on same column', () => {
      if (component.tableConfig.sortConfig) {
        component.tableConfig.sortConfig.direction = 'A';
        component.tableConfig.sortConfig.column = 'testingLabId';
      }
      component.onSortChange({ column: 'testingLabId', direction: 'A' } as any);
      expect(component.tableConfig.sortConfig?.direction).toBe('D');
    });

    it('should cycle: D → default on same column', () => {
      if (component.tableConfig.sortConfig) {
        component.tableConfig.sortConfig.direction = 'D';
        component.tableConfig.sortConfig.column = 'testingLabId';
      }
      component.onSortChange({ column: 'testingLabId', direction: 'A' } as any);
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
    });

    it('should start with A when clicking a different column', () => {
      if (component.tableConfig.sortConfig) {
        component.tableConfig.sortConfig.direction = 'D';
        component.tableConfig.sortConfig.column = 'testingLabId';
      }
      component.onSortChange({ column: 'testingLabName', direction: 'A' } as any);
      expect(component.tableConfig.sortConfig?.column).toBe('testingLabName');
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
    });

    it('should do nothing when sortConfig is null', () => {
      const original = component.tableConfig.sortConfig;
      component.tableConfig.sortConfig = undefined as any;
      serviceSpy.getAll.calls.reset();
      component.onSortChange({ column: 'testingLabId', direction: 'A' } as any);
      expect(serviceSpy.getAll).not.toHaveBeenCalled();
      component.tableConfig.sortConfig = original;
    });
  });

  describe('onRowAction', () => {
    it('should navigate to edit route on edit action', () => {
      const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
      component.onRowAction({ action: 'edit', row: mockLabs[0] } as any);
      expect(navigateSpy).toHaveBeenCalledWith([
        '/laboratory-functions/testing-modules/testing-administration/valid-remote-testing-labs/edit',
        'LAB001',
      ]);
    });

    it('should not navigate for non-edit actions', () => {
      const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
      component.onRowAction({ action: 'delete', row: mockLabs[0] } as any);
      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });

  describe('applyFilters', () => {
    it('should set appliedFilters and reload', () => {
      const filters = { effectiveDatePeriod: 'AFTER', effectiveDate: '2024-01-01' };
      component.applyFilters(filters as any);
      expect(component.appliedFilters).toEqual(filters as any);
      expect(serviceSpy.getAll).toHaveBeenCalledTimes(2);
    });

    it('should generate filter chips from applied filters', () => {
      const filters = { effectiveDatePeriod: 'AFTER', effectiveDate: '2024-01-01', terminationDatePeriod: null, terminationDate: null };
      component.applyFilters(filters as any);
      expect(component.filterChips.length).toBeGreaterThan(0);
    });

    it('should reset pageIndex to 0', () => {
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 5;
      }
      component.applyFilters({ effectiveDatePeriod: 'AFTER', effectiveDate: '2024-01-01' } as any);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  describe('onRemoveFilterChip', () => {
    it('should remove chip and reload', () => {
      component.appliedFilters = { effectiveDatePeriod: 'AFTER', effectiveDate: '2024-01-01' } as any;
      component.onRemoveFilterChip('effectiveDate');
      expect(serviceSpy.getAll).toHaveBeenCalledTimes(2);
    });

    it('should reset pageIndex to 0', () => {
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 3;
      }
      component.appliedFilters = { effectiveDatePeriod: 'AFTER', effectiveDate: '2024-01-01' } as any;
      component.onRemoveFilterChip('effectiveDate');
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  describe('onClearAllFilters', () => {
    it('should clear all filters and reload', () => {
      component.appliedFilters = { effectiveDatePeriod: 'AFTER' } as any;
      component.onClearAllFilters();
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(serviceSpy.getAll).toHaveBeenCalledTimes(2);
    });

    it('should reset pageIndex to 0', () => {
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 3;
      }
      component.onClearAllFilters();
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  describe('loadTableData error handling', () => {
    it('should set hasError and errorMessage on API error', () => {
      serviceSpy.getAll.and.returnValue(throwError(() => new Error('Server error')));
      component.loadTableData();
      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('Failed to load data. Please try again.');
    });
  });

  describe('chapter changes', () => {
    it('should reload data on chapter change', () => {
      serviceSpy.getAll.calls.reset();
      chapterChanged$.next();
      expect(serviceSpy.getAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const destroySpy = jest.spyOn(component['destroy$'], 'next');
      const completeSpy = jest.spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('table configuration', () => {
    it('should define 7 table columns', () => {
      expect(component.tableConfig.columns.length).toBe(7);
    });

    it('should have testingLabId as first sortable column', () => {
      expect(component.tableConfig.columns[0].key).toBe('testingLabId');
      expect(component.tableConfig.columns[0].sortable).toBe(true);
    });

    it('should have edit row action', () => {
      expect(component.tableConfig.rowActions?.length).toBe(1);
      expect(component.tableConfig.rowActions![0].action).toBe('edit');
    });

    it('should have default pagination of 25', () => {
      expect(component.tableConfig.pagination?.pageSize).toBe(25);
    });

    it('should have pageSizeOptions of [10, 25, 50, 100]', () => {
      expect(component.tableConfig.pagination?.pageSizeOptions).toEqual([10, 25, 50, 100]);
    });
  });

  describe('loadTableData with filters', () => {
    it('should pass searchKeyword when searchText is set', () => {
      component.searchText = 'LAB';
      serviceSpy.getAll.calls.reset();
      component.loadTableData();
      const callArgs = serviceSpy.getAll.calls.mostRecent().args;
      expect(callArgs[2].searchKeyword).toBe('LAB');
    });

    it('should pass effDateFrom for AFTER filter', () => {
      component.appliedFilters = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: '2024-01-01',
        terminationDatePeriod: null,
        terminationDate: null,
      };
      serviceSpy.getAll.calls.reset();
      component.loadTableData();
      const callArgs = serviceSpy.getAll.calls.mostRecent().args;
      expect(callArgs[2].effDateFrom).toBe('2024-01-01');
    });

    it('should pass effDateTo for BEFORE filter', () => {
      component.appliedFilters = {
        effectiveDatePeriod: 'BEFORE',
        effectiveDate: '2024-01-01',
        terminationDatePeriod: null,
        terminationDate: null,
      };
      serviceSpy.getAll.calls.reset();
      component.loadTableData();
      const callArgs = serviceSpy.getAll.calls.mostRecent().args;
      expect(callArgs[2].effDateTo).toBe('2024-01-01');
    });

    it('should pass termDateFrom for AFTER termination filter', () => {
      component.appliedFilters = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'AFTER',
        terminationDate: '2024-06-01',
      };
      serviceSpy.getAll.calls.reset();
      component.loadTableData();
      const callArgs = serviceSpy.getAll.calls.mostRecent().args;
      expect(callArgs[2].termDateFrom).toBe('2024-06-01');
    });

    it('should pass termDateTo for BEFORE termination filter', () => {
      component.appliedFilters = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'BEFORE',
        terminationDate: '2024-06-01',
      };
      serviceSpy.getAll.calls.reset();
      component.loadTableData();
      const callArgs = serviceSpy.getAll.calls.mostRecent().args;
      expect(callArgs[2].termDateTo).toBe('2024-06-01');
    });

    it('should pass sortColumn and sortOrder when direction is not default', () => {
      if (component.tableConfig.sortConfig) {
        component.tableConfig.sortConfig.direction = 'A';
        component.tableConfig.sortConfig.column = 'testingLabId';
      }
      serviceSpy.getAll.calls.reset();
      component.loadTableData();
      const callArgs = serviceSpy.getAll.calls.mostRecent().args;
      expect(callArgs[2].sortColumn).toBe('testingLabId');
      expect(callArgs[2].sortOrder).toBe('A');
    });

    it('should not pass sortColumn when direction is default', () => {
      if (component.tableConfig.sortConfig) {
        component.tableConfig.sortConfig.direction = 'default';
      }
      serviceSpy.getAll.calls.reset();
      component.loadTableData();
      const callArgs = serviceSpy.getAll.calls.mostRecent().args;
      expect(callArgs[2].sortColumn).toBeUndefined();
      expect(callArgs[2].sortOrder).toBeUndefined();
    });
  });
});
