import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ValidReagentCodesComponent } from './valid-reagent-codes';
import { ValidReagentCodeService } from './services/valid-reagent-code.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { of, throwError } from 'rxjs';
import { createMockPageHeaderService } from '@shared/testing/common-mocks';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('ValidReagentCodesComponent', () => {
  let component: ValidReagentCodesComponent;
  let fixture: ComponentFixture<ValidReagentCodesComponent>;
  let service: ValidReagentCodeService;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {

    const pageHeaderServiceSpy = createMockPageHeaderService();
    pageHeaderServiceSpy.pageHeaderData = signal({ title: 'Valid Reagent Codes', subtitle: 'Define and maintain reagent codes' });
    pageHeaderServiceSpy.getTitle.and.returnValue('Valid Reagent Codes');
    pageHeaderServiceSpy.getSubtitle.and.returnValue('Define and maintain reagent codes');



      TestBed.configureTestingModule({
      imports: [
        ValidReagentCodesComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        ValidReagentCodeService
      ]
    })
    .overrideProvider(PageHeaderService, { useValue: pageHeaderServiceSpy });



    fixture = TestBed.createComponent(ValidReagentCodesComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(ValidReagentCodeService);
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    });

  it('should create the component', () => {
    spyOn(service, 'getValidTestsLov').and.returnValue(of([]));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load data when test ID is set', () => {
    const mockData = {
      data: [
        {
          reagentType: 'R',
          controlFlag: null,
          reagentCode: 'A',
          reagentName: 'Anti-A',
          masterLotRequired: 'N',
          effDate: '2026-01-01T00:00:00Z',
          termDate: null,
          preparationFlag: 'P',
          prequalificationFlag: 'Y',
          lastModifyDate: null,
          lastModifyUser: null,
          testId: 'ABORh',
          testDesc: 'ABO & Rh Blood Groupings'
        }
      ],
      totalRecords: 1
    };

    spyOn(service, 'getAll').and.returnValue(of(mockData));

    component.currentTestId = 'ABORh';
    component.loadData();

    expect(service.getAll).toHaveBeenCalled();
    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].reagentCode).toBe('A');
  });

  it('should update query when filters are applied', () => {
    component.currentTestId = 'ABORh';
    component.currentTestDesc = 'ABO & Rh Blood Groupings';

    const filters = {
      testId: null,
      testDesc: null,
      showTerminated: 'N',
      reagentType: 'R',
      controlFlag: null,
      effectiveDatePeriod: null,
      effectiveDateAfter: null,
      effectiveDateBefore: null,
      terminationDatePeriod: null,
      terminationDateAfter: null,
      terminationDateBefore: null
    };

    spyOn(component, 'loadData');
    component.onApplyFilters(filters);

    expect(component.currentTestId).toBe('ABORh');
    expect(component.currentQuery.TestId).toBe('ABORh');
    expect(component.currentQuery.ReagentType).toBe('R');
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should open add dialog when test ID is selected', () => {
    component.currentTestId = 'ABORh';
    component.openAddDialog();

    expect(component.sidePanelOpen).toBe(true);
    expect(component.sidePanelMode).toBe('add');
    expect(component.sidePanelData).toBeNull();
  });

  it('should open edit dialog with data', () => {
    const testData = {
      reagentType: 'R',
      controlFlag: null,
      reagentCode: 'A',
      reagentName: 'Anti-A',
      masterLotRequired: 'N',
      effDate: '2026-01-01T00:00:00Z',
      termDate: null,
      preparationFlag: 'P',
      prequalificationFlag: 'Y',
      lastModifyDate: null,
      lastModifyUser: null,
      testId: 'ABORh',
      testDesc: 'ABO & Rh Blood Groupings'
    };

    component.openEditDialog(testData);

    expect(component.sidePanelOpen).toBe(true);
    expect(component.sidePanelMode).toBe('edit');
    expect(component.sidePanelData).toBe(testData);
  });

  it('should handle pagination changes', () => {
    spyOn(component, 'loadData');
    component.currentTestId = 'ABORh';

    const event = { pageIndex: 1, pageSize: 50, previousPageIndex: 0, length: 100 };
    component.onPageChange(event);

    expect(component.tableConfig.pagination?.pageIndex).toBe(1);
    expect(component.tableConfig.pagination?.pageSize).toBe(50);
    expect(component.currentQuery.Skip).toBe(50);
    expect(component.currentQuery.Take).toBe(50);
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should handle sort changes', () => {
    spyOn(component, 'loadData');
    component.currentTestId = 'ABORh';

    const event = { column: 'reagentCode', direction: 'A' as const };
    component.onSortChange(event);

    expect(component.tableConfig.sortConfig?.column).toBe('reagentCode');
    expect(component.tableConfig.sortConfig?.direction).toBe('A');
    expect(component.currentQuery.SortColumn).toBe('ReagentCode');
    expect(component.currentQuery.SortOrder).toBe('ASC');
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should handle sort with default direction', () => {
    spyOn(component, 'loadData');
    component.currentTestId = 'ABORh';

    const event = { column: 'reagentCode', direction: 'default' as const };
    component.onSortChange(event);

    expect(component.currentQuery.SortColumn).toBeNull();
    expect(component.currentQuery.SortOrder).toBeNull();
  });

  it('should handle descending sort direction', () => {
    spyOn(component, 'loadData');
    component.currentTestId = 'ABORh';

    const event = { column: 'reagentName', direction: 'D' as const };
    component.onSortChange(event);

    expect(component.currentQuery.SortColumn).toBe('ReagentName');
    expect(component.currentQuery.SortOrder).toBe('DESC');
  });

  it('should not open add dialog without test ID', () => {
    component.currentTestId = null;
    component.openAddDialog();
    expect(component.sidePanelOpen).toBe(false);
  });

  it('should clear all state on onClearAll', () => {
    spyOn(service, 'getValidTestsLov').and.returnValue(of([]));
    fixture.detectChanges();

    component.currentTestId = 'ABORh';
    component.currentTestDesc = 'ABO Test';
    component.dataSource = [{ reagentCode: 'A' } as any];
    component.sidePanelOpen = true;
    component.hasError = true;
    component.appliedFilters = { showTerminated: 'Y' } as any;
    component.filterChips = [{ key: 'test', label: 'Test', value: 'Y' }];

    component.onClearAll();

    expect(component.currentTestId).toBeNull();
    expect(component.currentTestDesc).toBeNull();
    expect(component.dataSource.length).toBe(0);
    expect(component.sidePanelOpen).toBe(false);
    expect(component.hasError).toBe(false);
    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips.length).toBe(0);
    expect(component.hasLoadedData).toBe(false);
  });

  it('should toggle filter panel', () => {
    component.isFilterOpen = false;
    component.toggleFilter();
    expect(component.isFilterOpen).toBe(true);
    component.toggleFilter();
    expect(component.isFilterOpen).toBe(false);
  });

  it('should handle search', () => {
    spyOn(component, 'loadData');
    component.currentTestId = 'ABORh';

    component.onSearch('anti');

    expect(component.currentQuery.SearchKeyword).toBe('anti');
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should clear search when empty string', () => {
    spyOn(component, 'loadData');
    component.currentTestId = 'ABORh';

    component.onSearch('');

    expect(component.currentQuery.SearchKeyword).toBeNull();
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should handle loadData error', () => {
    spyOn(service, 'getAll').and.returnValue(throwError(() => ({ status: 500 })));

    component.currentTestId = 'ABORh';
    component.loadData();

    expect(component.hasError).toBe(true);
    expect(component.isLoading).toBe(false);
    expect(component.errorMessage).toContain('Failed to load');
  });

  it('should not load data without test ID', () => {
    spyOn(service, 'getAll');
    component.currentTestId = null;
    component.loadData();

    expect(service.getAll).not.toHaveBeenCalled();
    expect(component.dataSource.length).toBe(0);
  });

  it('should close side panel and reset data', () => {
    component.sidePanelOpen = true;
    component.sidePanelData = { reagentCode: 'A' } as any;

    component.closeSidePanel();

    expect(component.sidePanelOpen).toBe(false);
    expect(component.sidePanelData).toBeNull();
  });

  it('should keep panel open on save with addAnother=true', () => {
    spyOn(component, 'loadData');
    component.sidePanelOpen = true;
    component.sidePanelMode = 'add';
    component.currentTestId = 'ABORh';

    component.onSaveSuccess(true);

    expect(component.sidePanelOpen).toBe(true);
    expect(component.sidePanelMode).toBe('add');
    expect(component.sidePanelData).toBeNull();
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should close panel on save with addAnother=false', () => {
    spyOn(component, 'loadData');
    component.sidePanelOpen = true;
    component.currentTestId = 'ABORh';

    component.onSaveSuccess(false);

    expect(component.sidePanelOpen).toBe(false);
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should handle mode change', () => {
    component.sidePanelMode = 'add';
    component.onModeChange('edit');
    expect(component.sidePanelMode).toBe('edit');
  });

  it('should return canAddNew correctly', () => {
    component.currentTestId = null;
    component.sidePanelOpen = false;
    expect(component.canAddNew).toBe(false);

    component.currentTestId = 'ABORh';
    expect(component.canAddNew).toBe(true);

    component.sidePanelOpen = true;
    expect(component.canAddNew).toBe(false);
  });

  it('should remove filter chip and reload data', () => {
    spyOn(component, 'loadData');
    component.currentTestId = 'ABORh';
    component.appliedFilters = {
      testId: 'ABORh',
      testDesc: 'Test',
      showTerminated: 'Y',
      reagentType: 'R',
      controlFlag: null,
      effectiveDatePeriod: null,
      effectiveDateAfter: null,
      effectiveDateBefore: null,
      terminationDatePeriod: null,
      terminationDateAfter: null,
      terminationDateBefore: null
    };

    component.onRemoveFilterChip('reagentType');

    expect(component.loadData).toHaveBeenCalled();
  });

  it('should not remove testId filter chip', () => {
    component.appliedFilters = {
      testId: 'ABORh',
      testDesc: 'Test',
      showTerminated: null,
      reagentType: null,
      controlFlag: null,
      effectiveDatePeriod: null,
      effectiveDateAfter: null,
      effectiveDateBefore: null,
      terminationDatePeriod: null,
      terminationDateAfter: null,
      terminationDateBefore: null
    };
    spyOn(component, 'loadData');

    component.onRemoveFilterChip('testId');

    expect(component.loadData).not.toHaveBeenCalled();
  });

  it('should clear all filters except test ID', () => {
    spyOn(component, 'loadData');
    component.currentTestId = 'ABORh';
    component.appliedFilters = {
      testId: 'ABORh',
      testDesc: 'Test',
      showTerminated: 'Y',
      reagentType: 'R',
      controlFlag: 'P',
      effectiveDatePeriod: null,
      effectiveDateAfter: null,
      effectiveDateBefore: null,
      terminationDatePeriod: null,
      terminationDateAfter: null,
      terminationDateBefore: null
    };

    component.onClearAllFilters();

    expect(component.appliedFilters!.testId).toBe('ABORh');
    expect(component.appliedFilters!.reagentType).toBeNull();
    expect(component.appliedFilters!.controlFlag).toBeNull();
    expect(component.appliedFilters!.showTerminated).toBeNull();
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should not clear all filters when no filters applied', () => {
    spyOn(component, 'loadData');
    component.appliedFilters = null;

    component.onClearAllFilters();

    expect(component.loadData).not.toHaveBeenCalled();
  });

  it('should generate filter chips on apply', () => {
    component.currentTestId = 'ABORh';
    component.currentTestDesc = 'ABO';
    spyOn(component, 'loadData');

    component.onApplyFilters({
      testId: null,
      testDesc: null,
      showTerminated: 'Y',
      reagentType: 'R',
      controlFlag: null,
      effectiveDatePeriod: null,
      effectiveDateAfter: null,
      effectiveDateBefore: null,
      terminationDatePeriod: null,
      terminationDateAfter: null,
      terminationDateBefore: null
    });

    expect(component.filterChips.length).toBeGreaterThan(0);
  });

  it('should handle row action for edit', () => {
    const row = { reagentCode: 'A' } as any;
    spyOn(component, 'openEditDialog');

    component.onRowAction({ action: 'edit', row });

    expect(component.openEditDialog).toHaveBeenCalledWith(row);
  });
});
