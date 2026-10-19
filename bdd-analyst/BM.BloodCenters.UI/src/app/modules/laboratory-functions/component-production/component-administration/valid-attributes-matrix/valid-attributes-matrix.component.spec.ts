import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { Overlay, OverlayModule } from '@angular/cdk/overlay';
import { TranslateModule } from '@ngx-translate/core';

import { ValidAttributesMatrixComponent } from './valid-attributes-matrix.component';
import { ValidAttributesMatrixService } from './services/valid-attributes-matrix.service';
import { ValidAttributesMatrix, ApiResponse, ValidAttributesMatrixFilterValue } from './models/valid-attributes-matrix.model';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { TablePageEvent, TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { createMockPageHeaderService } from '@shared/testing/common-mocks';

describe('ValidAttributesMatrixComponent', () => {
  let component: ValidAttributesMatrixComponent;
  let fixture: ComponentFixture<ValidAttributesMatrixComponent>;
  let mockService: jasmine.SpyObj<ValidAttributesMatrixService>;
  let chapterSubject: Subject<void>;

  const mockData: ValidAttributesMatrix[] = [
    {
      attribAddedGroup: '+',
      attribAddedCode: '+01',
      attribDeletedGroup: null,
      attribDeletedCode: 'V0001073',
      deleteModifierCode: 'M0007',
      addModifierCode: 'M0012',
      associatedAttribGroup: null,
      associatedAttribCode: 'V0001071',
      effDate: '2024-01-01',
      termDate: null,
      lastModifiedDate: '2024-01-01',
      auditKey: 12345,
      programId: 'VATTRMAT',
      attribAddedGroupDesc: 'Product Group Modifier',
      attribAddedCodeDesc: 'Washed'
    },
    {
      attribAddedGroup: '+',
      attribAddedCode: '+02',
      attribDeletedGroup: null,
      attribDeletedCode: null,
      deleteModifierCode: null,
      addModifierCode: 'M0002',
      associatedAttribGroup: null,
      associatedAttribCode: 'V0012004',
      effDate: '2024-01-01',
      termDate: '2024-12-31',
      lastModifiedDate: '2024-01-15',
      auditKey: 12346,
      programId: 'VATTRMAT',
      attribAddedGroupDesc: 'Product Expiration',
      attribAddedCodeDesc: 'Frozen'
    }
  ];

  const mockApiResponse: ApiResponse<ValidAttributesMatrix[]> = {
    success: true,
    data: mockData,
    total: 2,
    statusCode: 200,
    message: 'Success'
  };

  const mockHeaderService = {
    chapterTimeZone: signal('America/Chicago'),
    chapterChanged$: new Subject<void>()
  };

  beforeEach(() => {

    chapterSubject = mockHeaderService.chapterChanged$ as Subject<void>;

    mockService = jasmine.createSpyObj('ValidAttributesMatrixService', [
      'getValidAttributesMatrix',
      'getValidAttributesMatrixById',
      'createValidAttributesMatrix',
      'updateValidAttributesMatrix',
      'deleteValidAttributesMatrix',
      'getAttributeGroups',
      'getAttributeCodes',
      'getDeletedAttributeCodes',
      'getAssociatedAttributeCodes',
      'getModifierCodes'
    ]);

    mockService.getValidAttributesMatrix.and.returnValue(of(mockApiResponse));
    mockService.getAttributeCodes.and.returnValue(of([]));
    mockService.getDeletedAttributeCodes.and.returnValue(of([]));
    mockService.getAssociatedAttributeCodes.and.returnValue(of([]));
    mockService.getModifierCodes.and.returnValue(of([]));

    const mockPageHeaderService = createMockPageHeaderService();
    Object.defineProperty(mockPageHeaderService, 'pageHeaderData', {
      value: signal({ title: 'Valid Attributes Matrix', subtitle: 'Manage valid attributes matrix entries.' }),
      writable: false
    });



      TestBed.configureTestingModule({
      imports: [
        ValidAttributesMatrixComponent,
        NoopAnimationsModule,
        OverlayModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        Overlay,
        { provide: ValidAttributesMatrixService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });




      mockService.getValidAttributesMatrix.calls.reset();


      mockService.getValidAttributesMatrixById.calls.reset();


      mockService.createValidAttributesMatrix.calls.reset();


      mockService.updateValidAttributesMatrix.calls.reset();


      mockService.deleteValidAttributesMatrix.calls.reset();


      mockService.getAttributeGroups.calls.reset();


      mockService.getAttributeCodes.calls.reset();


      mockService.getDeletedAttributeCodes.calls.reset();


      mockService.getAssociatedAttributeCodes.calls.reset();


      mockService.getModifierCodes.calls.reset();


      mockService.getValidAttributesMatrix.and.returnValue(of(mockApiResponse));


      mockService.getAttributeCodes.and.returnValue(of([]));


      mockService.getDeletedAttributeCodes.and.returnValue(of([]));


      mockService.getAssociatedAttributeCodes.and.returnValue(of([]));


      mockService.getModifierCodes.and.returnValue(of([]));


    fixture = TestBed.createComponent(ValidAttributesMatrixComponent);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should load filter dropdown options on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockService.getAttributeCodes).toHaveBeenCalled();
      expect(mockService.getDeletedAttributeCodes).toHaveBeenCalled();
      expect(mockService.getAssociatedAttributeCodes).toHaveBeenCalled();
      expect(mockService.getModifierCodes).toHaveBeenCalled();
    }));

    it('should initialize table configuration correctly', () => {
      expect(component.tableConfig.columns.length).toBeGreaterThan(0);
      expect(component.tableConfig.rowActions?.length).toBeGreaterThan(0);
      expect(component.tableConfig.pagination?.pageSize).toBe(25);
    });

    it('should initialize search configuration correctly', () => {
      expect(component.searchConfig.placeholder).toContain('Attribute');
      expect(component.searchConfig.minLength).toBe(2);
    });

    it('should have correct VALIDATION constants', () => {
      expect(component.VALIDATION.LIMITS.SEARCH_MIN_LENGTH).toBe(2);
      expect(component.VALIDATION.LIMITS.DEFAULT_PAGE_SIZE).toBe(25);
      expect(component.VALIDATION.LIMITS.DESCRIPTION_TRUNCATE_LENGTH).toBe(50);
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

    it('should initialize table columns with correct count', () => {
      const columns = component.tableConfig.columns;
      expect(columns.length).toBe(11);
    });

    it('should initialize table with an edit row action', () => {
      const rowActions = component.tableConfig.rowActions!;
      expect(rowActions.length).toBe(1);
      expect(rowActions[0].action).toBe('edit');
      expect(rowActions[0].icon).toBe('edit');
    });

    it('should configure search bar with searchOnEnterOnly', () => {
      expect((component.searchConfig as any).searchOnEnterOnly).toBeTrue();
    });

    it('should configure table sortConfig with empty defaults', () => {
      expect(component.tableConfig.sortConfig!.column).toBe('');
      expect(component.tableConfig.sortConfig!.direction).toBe('D');
    });

    it('should set stickyHeader and stickyActionsColumn to true', () => {
      expect(component.tableConfig.stickyHeader).toBeTrue();
      expect(component.tableConfig.stickyActionsColumn).toBeTrue();
    });

    it('should configure pagination options', () => {
      const pagination = component.tableConfig.pagination!;
      expect(pagination.pageSizeOptions).toEqual([10, 25, 50, 100]);
      expect(pagination.showFirstLastButtons).toBeTrue();
      expect(pagination.pageIndex).toBe(0);
      expect(pagination.totalRecords).toBe(0);
    });

    it('should call loadTableData on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockService.getValidAttributesMatrix).toHaveBeenCalled();
    }));

    it('should subscribe to chapter changes on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      mockService.getValidAttributesMatrix.calls.reset();
      chapterSubject.next();
      tick();

      expect(mockService.getValidAttributesMatrix).toHaveBeenCalled();
    }));

  });

  describe('loadTableData', () => {
    it('should set isLoading true while loading and false after success', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.isLoading).toBeFalse();
    }));

    it('should populate dataSource on successful load', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.dataSource).toEqual(mockData);
      expect(component.tableConfig.pagination!.totalRecords).toBe(2);
    }));

    it('should handle empty data response', fakeAsync(() => {
      mockService.getValidAttributesMatrix.and.returnValue(of({
        success: true,
        data: null as any,
        total: 0,
        statusCode: 200,
        message: 'Success'
      }));

      fixture.detectChanges();
      tick();

      expect(component.dataSource).toEqual([]);
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
    }));

    it('should set hasError and errorMessage on API error', fakeAsync(() => {
      mockService.getValidAttributesMatrix.and.returnValue(throwError(() => new Error('Server error')));

      fixture.detectChanges();
      tick();

      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('No Valid Attributes Matrix entries available to display');
    }));

    it('should calculate skip and take from pagination', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 10;
      mockService.getValidAttributesMatrix.calls.reset();

      component.loadTableData();
      tick();

      expect(mockService.getValidAttributesMatrix).toHaveBeenCalledWith(10, 20, component.requestState);
    }));

    it('should use default values when pagination is incomplete', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.tableConfig.pagination!.pageIndex = 0;
      component.tableConfig.pagination!.pageSize = 25;
      mockService.getValidAttributesMatrix.calls.reset();

      component.loadTableData();
      tick();

      expect(mockService.getValidAttributesMatrix).toHaveBeenCalledWith(25, 0, component.requestState);
    }));

    it('should clear hasError on new load', fakeAsync(() => {
      mockService.getValidAttributesMatrix.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      tick();
      expect(component.hasError).toBeTrue();

      mockService.getValidAttributesMatrix.and.returnValue(of(mockApiResponse));
      component.loadTableData();
      tick();

      expect(component.hasError).toBeFalse();
    }));
  });

  describe('Search Functionality', () => {
    it('should update request state and reload data on search', () => {
      component.onSearch('ABO');

      expect(component.requestState.searchKeyword).toBe('ABO');
      expect(mockService.getValidAttributesMatrix).toHaveBeenCalled();
    });

    it('should clear searchKeyword when empty string is provided', () => {
      component.onSearch('');

      expect(component.searchText).toBe('');
      expect(component.requestState.searchKeyword).toBeUndefined();
    });

    it('should reset pagination to first page on search', () => {
      component.tableConfig.pagination!.pageIndex = 3;
      component.onSearch('test');

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should close side panel when searching', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockData[0];

      component.onSearch('test');

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });

    it('should reload filter dropdown options on search', () => {
      mockService.getAttributeCodes.calls.reset();
      mockService.getDeletedAttributeCodes.calls.reset();
      mockService.getAssociatedAttributeCodes.calls.reset();
      mockService.getModifierCodes.calls.reset();

      component.onSearch('test');

      expect(mockService.getAttributeCodes).toHaveBeenCalled();
      expect(mockService.getDeletedAttributeCodes).toHaveBeenCalled();
      expect(mockService.getAssociatedAttributeCodes).toHaveBeenCalled();
      expect(mockService.getModifierCodes).toHaveBeenCalled();
    });

    it('should store the search text', () => {
      component.onSearch('RhD');
      expect(component.searchText).toBe('RhD');
    });

  });

  describe('Pagination', () => {
    it('should update page index and page size on page change', () => {
      const pageEvent: TablePageEvent = { pageIndex: 2, pageSize: 50 };
      component.onPageChange(pageEvent);

      expect(component.tableConfig.pagination!.pageIndex).toBe(2);
      expect(component.tableConfig.pagination!.pageSize).toBe(50);
    });

    it('should reload data on page change', () => {
      const pageEvent: TablePageEvent = { pageIndex: 1, pageSize: 25 };
      component.onPageChange(pageEvent);

      expect(mockService.getValidAttributesMatrix).toHaveBeenCalled();
    });

    it('should close side panel on page change', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockData[0];

      const pageEvent: TablePageEvent = { pageIndex: 1, pageSize: 25 };
      component.onPageChange(pageEvent);

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('Sorting', () => {
    it('should set ascending sort order', () => {
      component.onSortChange({ column: 'attribAddedCode', direction: 'A' });

      expect(component.requestState.sortColumn).toBe('AttribAddedCode');
      expect(component.requestState.sortOrder).toBe('ASC');
    });

    it('should set descending sort order', () => {
      component.onSortChange({ column: 'attribAddedCode', direction: 'D' });

      expect(component.requestState.sortColumn).toBe('AttribAddedCode');
      expect(component.requestState.sortOrder).toBe('DESC');
    });

    it('should clear sort when direction is default', () => {
      component.requestState.sortColumn = 'AttribAddedCode';
      component.requestState.sortOrder = 'ASC';

      component.onSortChange({ column: 'attribAddedCode', direction: 'default' });

      expect(component.requestState.sortColumn).toBeUndefined();
      expect(component.requestState.sortOrder).toBeUndefined();
    });

    it('should use original column name when not in columnMap', () => {
      component.onSortChange({ column: 'effDate', direction: 'A' });

      expect(component.requestState.sortColumn).toBe('effDate');
      expect(component.requestState.sortOrder).toBe('ASC');
    });

    it('should reset to first page when sorting changes', () => {
      component.tableConfig.pagination!.pageIndex = 2;
      component.onSortChange({ column: 'attribAddedCode', direction: 'D' });
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should update table sortConfig', () => {
      component.onSortChange({ column: 'attribAddedCode', direction: 'A' });

      expect(component.tableConfig.sortConfig!.column).toBe('attribAddedCode');
      expect(component.tableConfig.sortConfig!.direction).toBe('A');
    });

    it('should close side panel on sort change', () => {
      component.sidePanelOpen = true;
      component.onSortChange({ column: 'attribAddedCode', direction: 'A' });

      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should reload data after sort change', () => {
      mockService.getValidAttributesMatrix.calls.reset();
      component.onSortChange({ column: 'attribAddedCode', direction: 'A' });

      expect(mockService.getValidAttributesMatrix).toHaveBeenCalled();
    });
  });

  describe('Filters', () => {
    it('should apply filters and update request state', () => {
      const filters: ValidAttributesMatrixFilterValue = {
        associatedAttribCode: 'V0001071',
        deleteModifierCode: 'M0007',
        attribDeletedCode: 'V0001073'
      };

      component.applyFilters(filters);

      expect(component.appliedFilters).toEqual(filters);
      expect(component.requestState.associatedAttribCode).toBe('V0001071');
      expect(component.requestState.modifierCode).toBe('M0007');
      expect(component.requestState.attribDeletedCode).toBe('V0001073');
    });

    it('should generate filter chips when filters are applied', () => {
      const filters: ValidAttributesMatrixFilterValue = {
        associatedAttribCode: 'V0001071'
      };

      component.applyFilters(filters);

      expect(component.filterChips.length).toBeGreaterThan(0);
      expect(component.filterChips[0].key).toBe('associatedAttribCode');
    });

    it('should reset pagination to first page when filters are applied', () => {
      component.tableConfig.pagination!.pageIndex = 3;

      component.applyFilters({ attribDeletedCode: 'V0001073' });

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should reload data when filters are applied', () => {
      mockService.getValidAttributesMatrix.calls.reset();

      component.applyFilters({ attribDeletedCode: 'V0001073' });

      expect(mockService.getValidAttributesMatrix).toHaveBeenCalled();
    });

    it('should close side panel when filters are applied', () => {
      component.sidePanelOpen = true;
      component.applyFilters({ attribDeletedCode: 'V0001073' });

      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should clear all filters and reset state', () => {
      component.appliedFilters = { attribDeletedCode: 'V0001073', associatedAttribCode: 'V0001071' };
      component.filterChips = [{ key: 'attribDeletedCode', label: 'test', value: 'test', removable: true }];
      component.requestState = {
        searchKeyword: 'test',
        associatedAttribCode: 'V0001071',
        modifierCode: 'M0007',
        attribDeletedCode: 'V0001073'
      };

      component.clearAllFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.requestState.associatedAttribCode).toBeUndefined();
      expect(component.requestState.modifierCode).toBeUndefined();
      expect(component.requestState.attribDeletedCode).toBeUndefined();
      expect(component.requestState.searchKeyword).toBe('test');
    });

    it('should reset pagination when clearing all filters', () => {
      component.tableConfig.pagination!.pageIndex = 5;
      component.clearAllFilters();

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should reload data when clearing all filters', () => {
      mockService.getValidAttributesMatrix.calls.reset();
      component.clearAllFilters();

      expect(mockService.getValidAttributesMatrix).toHaveBeenCalled();
    });

    it('should close side panel when clearing all filters', () => {
      component.sidePanelOpen = true;
      component.clearAllFilters();

      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should report active filters correctly', () => {
      expect(component.hasActiveFilters()).toBeFalse();

      component.filterChips = [{ key: 'attribDeletedCode', label: 'test', value: 'test', removable: true }];
      expect(component.hasActiveFilters()).toBeTrue();
    });

    it('should remove a single filter chip and apply remaining filters', () => {
      component.appliedFilters = {
        associatedAttribCode: 'V0001071',
        attribDeletedCode: 'V0001073'
      };

      component.onRemoveFilterChip('associatedAttribCode');

      expect(component.appliedFilters).toEqual({ attribDeletedCode: 'V0001073' });
    });

    it('should clear all filters when removing the last chip', () => {
      component.appliedFilters = {
        attribDeletedCode: 'V0001073'
      };

      component.onRemoveFilterChip('attribDeletedCode');

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
    });

    it('should call clearAllFilters when removeFilterByChipKey returns null', () => {
      spyOn(component, 'clearAllFilters').and.callThrough();
      component.appliedFilters = { attribDeletedCode: 'V0001073' };

      component.onRemoveFilterChip('attribDeletedCode');

      expect(component.clearAllFilters).toHaveBeenCalled();
    });

    it('should call applyFilters when removeFilterByChipKey returns updated filters', () => {
      spyOn(component, 'applyFilters').and.callThrough();
      component.appliedFilters = {
        associatedAttribCode: 'V0001071',
        attribDeletedCode: 'V0001073'
      };

      component.onRemoveFilterChip('associatedAttribCode');

      expect(component.applyFilters).toHaveBeenCalled();
    });

    it('should call clearAllFilters when appliedFilters is null and chip is removed', () => {
      spyOn(component, 'clearAllFilters').and.callThrough();
      component.appliedFilters = null;

      component.onRemoveFilterChip('attribDeletedCode');

      expect(component.clearAllFilters).toHaveBeenCalled();
    });
  });

  describe('Filter Panel (openFilter)', () => {
    it('should return early if filter is already open', () => {
      component.isFilterOpen = true;
      const overlayInstance = TestBed.inject(Overlay);
      spyOn(overlayInstance, 'create');

      component.openFilter();

      expect(overlayInstance.create).not.toHaveBeenCalled();
    });

    it('should return early if filterBtn is not available', () => {
      component.isFilterOpen = false;
      (component as any).filterBtn = undefined;
      const overlayInstance = TestBed.inject(Overlay);
      spyOn(overlayInstance, 'create');

      component.openFilter();

      expect(overlayInstance.create).not.toHaveBeenCalled();
    });
  });

  describe('Side Panel Management', () => {
    it('should open side panel in add mode', () => {
      component.createRecord();

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelOpen).toBeTrue();
    });

    it('should open side panel in edit mode with record data', () => {
      component.editRecord(mockData[0]);

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockData[0]);
      expect(component.sidePanelOpen).toBeTrue();
    });

    it('should close side panel and clear data', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockData[0];

      component.closeSidePanel();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });

    it('should handle mode change from side panel', () => {
      component.sidePanelData = mockData[0];
      component.onModeChange('add');

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should keep sidePanelData when mode changes to edit', () => {
      component.sidePanelData = mockData[0];
      component.onModeChange('edit');

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockData[0]);
    });

    it('should reload table data on save success', () => {
      mockService.getValidAttributesMatrix.calls.reset();

      component.onSaveSuccess();

      expect(mockService.getValidAttributesMatrix).toHaveBeenCalled();
    });
  });

  describe('Row Actions', () => {
    it('should call editRecord for edit row action', () => {
      spyOn(component, 'editRecord');

      const event: TableRowActionEvent<ValidAttributesMatrix> = {
        action: 'edit',
        row: mockData[0]
      };

      component.onRowAction(event);

      expect(component.editRecord).toHaveBeenCalledWith(mockData[0]);
    });

    it('should not throw for unknown row action', () => {
      const event: TableRowActionEvent<ValidAttributesMatrix> = {
        action: 'unknown',
        row: mockData[0]
      };

      expect(() => component.onRowAction(event)).not.toThrow();
    });
  });

  describe('Chapter Changes', () => {
    it('should reset requestState when chapter changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.requestState = {
        searchKeyword: 'test',
        sortColumn: 'AttribAddedCode',
        sortOrder: 'ASC',
        associatedAttribCode: 'V0001071'
      };

      chapterSubject.next();
      tick();

      expect(component.requestState).toEqual({});
    }));

    it('should close side panel and clear filters when chapter changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.sidePanelOpen = true;
      component.sidePanelData = mockData[0];
      component.appliedFilters = { attribDeletedCode: 'V0001073' };
      component.filterChips = [{ key: 'test', label: 'test', value: 'test', removable: true }];

      chapterSubject.next();
      tick();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
    }));

    it('should reload table data and filter options when chapter changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      mockService.getValidAttributesMatrix.calls.reset();
      mockService.getAttributeCodes.calls.reset();
      mockService.getDeletedAttributeCodes.calls.reset();
      mockService.getAssociatedAttributeCodes.calls.reset();
      mockService.getModifierCodes.calls.reset();

      chapterSubject.next();
      tick();

      expect(mockService.getValidAttributesMatrix).toHaveBeenCalled();
      expect(mockService.getAttributeCodes).toHaveBeenCalled();
      expect(mockService.getDeletedAttributeCodes).toHaveBeenCalled();
      expect(mockService.getAssociatedAttributeCodes).toHaveBeenCalled();
      expect(mockService.getModifierCodes).toHaveBeenCalled();
    }));
  });

  describe('Keyboard Shortcuts', () => {
    it('should open add panel on Alt+C', () => {
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
    });

    it('should focus search bar on Alt+S', () => {
      const mockSearchBar = { focus: jasmine.createSpy('focus') };
      (component as any).searchBarComponent = mockSearchBar;

      const event = new KeyboardEvent('keydown', { altKey: true, key: 's' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockSearchBar.focus).toHaveBeenCalled();
    });

    it('should open filter on Alt+F', () => {
      spyOn(component, 'openFilter');

      const event = new KeyboardEvent('keydown', { altKey: true, key: 'f' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.openFilter).toHaveBeenCalled();
    });

    it('should close filter panel on Escape when overlay is open', () => {
      (component as any).overlayRef = { dispose: jasmine.createSpy('dispose') };
      component.isFilterOpen = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should close side panel on Escape when side panel is open and no overlay', () => {
      (component as any).overlayRef = null;
      component.sidePanelOpen = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should prioritize closing overlay over side panel on Escape', () => {
      (component as any).overlayRef = { dispose: jasmine.createSpy('dispose') };
      component.isFilterOpen = true;
      component.sidePanelOpen = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.handleKeyboardShortcut(event);

      expect(component.isFilterOpen).toBeFalse();
      expect(component.sidePanelOpen).toBeTrue();
    });

    it('should do nothing on Escape when nothing is open', () => {
      (component as any).overlayRef = null;
      component.sidePanelOpen = false;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should not respond to non-shortcut keys', () => {
      spyOn(component, 'createRecord');
      spyOn(component, 'openFilter');

      const event = new KeyboardEvent('keydown', { key: 'a' });
      component.handleKeyboardShortcut(event);

      expect(component.createRecord).not.toHaveBeenCalled();
      expect(component.openFilter).not.toHaveBeenCalled();
    });

    it('should handle uppercase key in Alt+C shortcut', () => {
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'C' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBeTrue();
    });
  });

  describe('Date Formatting', () => {
    it('should format valid date via column valueFormatter', () => {
      const effDateColumn = component.tableConfig.columns.find(c => c.key === 'effDate');
      expect(effDateColumn).toBeTruthy();

      const result = effDateColumn!.valueFormatter!('2024-01-15');
      expect(result).toMatch(/15-JAN-2024/);
    });

    it('should return dash for null date via column valueFormatter', () => {
      const effDateColumn = component.tableConfig.columns.find(c => c.key === 'effDate');
      const result = effDateColumn!.valueFormatter!(null);
      expect(result).toBe('-');
    });

    it('should format termination date column', () => {
      const termDateColumn = component.tableConfig.columns.find(c => c.key === 'termDate');
      expect(termDateColumn).toBeTruthy();

      const result = termDateColumn!.valueFormatter!('2024-12-31');
      expect(result).toMatch(/31-DEC-2024/);
    });

    it('should format lastModifiedDate column', () => {
      const lastModifiedColumn = component.tableConfig.columns.find(c => c.key === 'lastModifiedDate');
      expect(lastModifiedColumn).toBeTruthy();

      const result = lastModifiedColumn!.valueFormatter!('2024-06-15');
      expect(result).toMatch(/15-JUN-2024/);
    });
  });

  describe('loadFilterDropdownOptions', () => {
    it('should populate attribute code options from service', fakeAsync(() => {
      const mockOptions = [{ attribCode: 'V001', attribDesc: 'Test' }];
      mockService.getAttributeCodes.and.returnValue(of(mockOptions));

      fixture.detectChanges();
      tick();

      expect(component.attributeCodeOptions).toEqual(mockOptions);
    }));

    it('should populate deleted attribute code options from service', fakeAsync(() => {
      const mockOptions = [{ attribCode: 'V002', attribDesc: 'Deleted' }];
      mockService.getDeletedAttributeCodes.and.returnValue(of(mockOptions));

      fixture.detectChanges();
      tick();

      expect(component.deletedAttributeCodeOptions).toEqual(mockOptions);
    }));

    it('should populate associated attribute code options from service', fakeAsync(() => {
      const mockOptions = [{ attribCode: 'V003', attribDesc: 'Associated' }];
      mockService.getAssociatedAttributeCodes.and.returnValue(of(mockOptions));

      fixture.detectChanges();
      tick();

      expect(component.associatedAttributeCodeOptions).toEqual(mockOptions);
    }));

    it('should populate modifier code options from service', fakeAsync(() => {
      const mockOptions = [{ code: 'M001', description: 'Modifier' }];
      mockService.getModifierCodes.and.returnValue(of(mockOptions));

      fixture.detectChanges();
      tick();

      expect(component.modifierCodeOptions).toEqual(mockOptions);
    }));

    it('should pass search text to filter dropdown service calls', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      mockService.getAttributeCodes.calls.reset();
      mockService.getDeletedAttributeCodes.calls.reset();
      mockService.getAssociatedAttributeCodes.calls.reset();
      mockService.getModifierCodes.calls.reset();

      component.searchText = 'ABO';
      component.onSearch('ABO');
      tick();

      expect(mockService.getAttributeCodes).toHaveBeenCalledWith(undefined, 'ABO');
      expect(mockService.getDeletedAttributeCodes).toHaveBeenCalledWith(undefined, 'ABO');
      expect(mockService.getAssociatedAttributeCodes).toHaveBeenCalledWith(undefined, 'ABO');
      expect(mockService.getModifierCodes).toHaveBeenCalledWith('ABO');
    }));

    it('should pass undefined for search param when search text is empty', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      mockService.getAttributeCodes.calls.reset();

      component.searchText = '';
      component.onSearch('');
      tick();

      expect(mockService.getAttributeCodes).toHaveBeenCalledWith(undefined, undefined);
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should dispose overlay if it exists', () => {
      const mockOverlayRef = { dispose: jasmine.createSpy('dispose') };
      (component as any).overlayRef = mockOverlayRef;

      component.ngOnDestroy();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
    });

    it('should not throw if overlayRef is null on destroy', () => {
      (component as any).overlayRef = null;

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('Table Column Configuration', () => {
    it('should have attribAddedCode column as sortable', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'attribAddedCode');
      expect(col).toBeTruthy();
      expect(col!.sortable).toBeTrue();
    });

    it('should have description columns with truncation', () => {
      const descCols = component.tableConfig.columns.filter(c => c.truncate === true);
      expect(descCols.length).toBe(2);
      descCols.forEach(col => {
        expect(col.truncateLength).toBe(50);
      });
    });

    it('should have correct column headers', () => {
      const headers = component.tableConfig.columns.map(c => c.header);
      expect(headers).toContain('Attribute Group');
      expect(headers).toContain('Attribute Code');
      expect(headers).toContain('Deleted Modifier');
      expect(headers).toContain('Deleted Attribute Code');
      expect(headers).toContain('Added Modifier');
      expect(headers).toContain('Added Attribute Code');
      expect(headers).toContain('Effective Date');
      expect(headers).toContain('Termination Date');
      expect(headers).toContain('Last Modified');
    });

    it('should have valueFormatter on date columns only', () => {
      const dateKeys = ['effDate', 'termDate', 'lastModifiedDate'];
      component.tableConfig.columns.forEach(col => {
        if (dateKeys.includes(col.key as string)) {
          expect(col.valueFormatter).toBeDefined();
        }
      });
    });
  });
});
