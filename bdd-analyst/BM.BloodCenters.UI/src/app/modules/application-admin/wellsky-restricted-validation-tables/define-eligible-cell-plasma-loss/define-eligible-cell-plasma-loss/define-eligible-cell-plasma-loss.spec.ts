import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateService } from '@ngx-translate/core';
import { signal, ElementRef } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { DefineEligibleCellPlasmaLoss } from './define-eligible-cell-plasma-loss';
import { EligiblePlasmaCellLossService } from '../services/eligible-plasma-cell-loss.service';
import { EligiblePlasmaCellLossRecord } from '../models/eligible-plasma-cell-loss.model';
import { PageHeaderService } from '@shared/services/page-header.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Overlay } from '@angular/cdk/overlay';

describe('DefineEligibleCellPlasmaLoss', () => {
  let component: DefineEligibleCellPlasmaLoss;
  let fixture: ComponentFixture<DefineEligibleCellPlasmaLoss>;
  let mockService: jasmine.SpyObj<EligiblePlasmaCellLossService>;

  const mockRecords: EligiblePlasmaCellLossRecord[] = [
    {
      cellType: 'PLASM',
      description: 'Plasma',
      minWeight: 110,
      maxWeight: 174,
      auditKey: '20492205',
      maxLoss: 12000,
      period: 365,
      effectiveDate: '2001-01-02T00:00:00',
      terminationDate: null
    },
    {
      cellType: 'RBC',
      description: 'Red Blood Cells',
      minWeight: 120,
      maxWeight: 200,
      auditKey: '20492206',
      maxLoss: 500,
      period: 56,
      effectiveDate: '2020-05-15T00:00:00',
      terminationDate: null
    }
  ];

  const mockPageHeaderService = {
    pageHeaderData: signal({
      title: 'Define Eligible Cell & Plasma Loss',
      subtitle: 'Manage eligible cell and plasma loss records'
    })
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('EligiblePlasmaCellLossService', ['getRecords', 'getFilterOptions', 'getRecordByAuditKey']);
    mockService.getRecords.and.returnValue(of(mockRecords));
    mockService.getFilterOptions.and.returnValue(of({
      cellTypes: [],
      statusOptions: [],
      title: '',
      subtitle: ''
    }));



      TestBed.configureTestingModule({
imports: [
        DefineEligibleCellPlasmaLoss,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: EligiblePlasmaCellLossService,
          useValue: mockService
        },
        {
          provide: PageHeaderService,
          useValue: mockPageHeaderService
        },
        {
          provide: TranslateService,
          useValue: {
            get: (key: string) => of(key),
            instant: (key: string) => key
          }
        }
      ]
    });


    });



  beforeEach(() => {

      mockService.getRecords.and.returnValue(of(mockRecords));


      mockService.getFilterOptions.and.returnValue(of({
      cellTypes: [],
      statusOptions: [],
      title: '',
      subtitle: ''
    }));


    fixture = TestBed.createComponent(DefineEligibleCellPlasmaLoss);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should open side panel in add mode when create record is called', () => {
    component.createRecord();

    expect(component.sidePanelOpen).toBe(true);
    expect(component.sidePanelMode).toBe('add');
    expect(component.sidePanelData).toBeNull();
  });


  it('should generate filter chips when filters are applied', () => {
    const filters = {
      cellType: 'PLASM',
      status: 'all'
    };

    component.applyFilters(filters);

    expect(component.filterChips.length).toBe(2);
    expect(component.filterChips[0].key).toBe('cellType');
    expect(component.filterChips[1].key).toBe('status');
  });

  it('should map header from PageHeaderService', () => {
    expect(component.headerConfig).toBeDefined();
    expect(component.headerConfig.title).toBe('Define Eligible Cell & Plasma Loss');
  });

  it('should handle paginated response in loadData', () => {
    const paginatedResponse = { records: mockRecords, totalCount: 50 };
    mockService.getRecords.and.returnValue(of(paginatedResponse));
    component.loadData();
    expect(component.dataSource.length).toBe(2);
    expect(component.tableConfig.pagination!.totalRecords).toBe(50);
    expect(component.isLoading).toBe(false);
  });

  it('should handle empty response in loadData', () => {
    mockService.getRecords.and.returnValue(of({} as any));
    component.loadData();
    expect(component.dataSource).toEqual([]);
    expect(component.tableConfig.pagination!.totalRecords).toBe(0);
    expect(component.isLoading).toBe(false);
  });

  it('should handle error in loadData', () => {
    mockService.getRecords.and.returnValue(throwError(() => new Error('fail')));
    component.loadData();
    expect(component.hasError).toBe(true);
    expect(component.errorMessage).toBe('Failed to load records. Please try again.');
    expect(component.isLoading).toBe(false);
  });

  it('should return null sort param when direction is default', () => {
    component.tableConfig.sortConfig = { column: 'cellType', direction: 'default' };
    expect((component as any).getSortParam()).toBeNull();
  });

  it('should return null sort param when column is empty', () => {
    component.tableConfig.sortConfig = { column: '', direction: 'A' } as any;
    expect((component as any).getSortParam()).toBeNull();
  });

  it('should return asc sort param for direction A', () => {
    component.tableConfig.sortConfig = { column: 'cellType', direction: 'A' } as any;
    expect((component as any).getSortParam()).toBe('cellType:asc');
  });

  it('should return desc sort param and map column names', () => {
    component.tableConfig.sortConfig = { column: 'minWeight', direction: 'D' } as any;
    expect((component as any).getSortParam()).toBe('fromWeight:desc');
  });

  it('should use column name directly when not in column map', () => {
    component.tableConfig.sortConfig = { column: 'description', direction: 'A' } as any;
    expect((component as any).getSortParam()).toBe('description:asc');
  });

  it('should open side panel in edit mode on successful editRecord', () => {
    mockService.getRecordByAuditKey.and.returnValue(of(mockRecords[0]));
    component.editRecord(mockRecords[0]);
    expect(component.sidePanelMode).toBe('edit');
    expect(component.sidePanelData).toEqual(mockRecords[0]);
    expect(component.sidePanelOpen).toBe(true);
    expect(component.isLoading).toBe(false);
  });

  it('should set error state on editRecord failure', () => {
    mockService.getRecordByAuditKey.and.returnValue(throwError(() => new Error('fail')));
    component.editRecord(mockRecords[0]);
    expect(component.hasError).toBe(true);
    expect(component.errorMessage).toContain('PLASM');
    expect(component.isLoading).toBe(false);
  });

  it('should update pagination and reload on page change', () => {
    spyOn(component, 'loadData');
    component.onPageChange({ pageIndex: 2, pageSize: 50 } as any);
    expect(component.tableConfig.pagination!.pageIndex).toBe(2);
    expect(component.tableConfig.pagination!.pageSize).toBe(50);
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should update sort config and reload on sort change', () => {
    spyOn(component, 'loadData');
    component.onSortChange({ column: 'maxLoss', direction: 'A' } as any);
    expect(component.tableConfig.sortConfig!.column).toBe('maxLoss');
    expect(component.tableConfig.sortConfig!.direction).toBe('A');
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should handle edit row action', () => {
    const mockDataTable = { activeRow: null } as any;
    component.dataTableComponent = mockDataTable;
    mockService.getRecordByAuditKey.and.returnValue(of(mockRecords[0]));
    component.onRowAction({ action: 'edit', row: mockRecords[0] } as any);
    expect(mockDataTable.activeRow).toBe(mockRecords[0]);
    expect(component.sidePanelMode).toBe('edit');
  });

  it('should close side panel and clear data', () => {
    component.sidePanelOpen = true;
    component.sidePanelData = mockRecords[0];
    component.closeSidePanel();
    expect(component.sidePanelOpen).toBe(false);
    expect(component.sidePanelData).toBeNull();
  });

  it('should reset page index and reload on save success', () => {
    spyOn(component, 'loadData');
    component.tableConfig.pagination!.pageIndex = 3;
    component.onSaveSuccess();
    expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should clear cellType filter on chip removal', () => {
    spyOn(component, 'applyFilters');
    component.appliedFilters = { cellType: 'PLASM', status: 'all' };
    component.onRemoveFilterChip('cellType');
    expect(component.applyFilters).toHaveBeenCalledWith(jasmine.objectContaining({ cellType: null }));
  });

  it('should reset status filter on chip removal', () => {
    spyOn(component, 'applyFilters');
    component.appliedFilters = { cellType: 'PLASM', status: 'all' };
    component.onRemoveFilterChip('status');
    expect(component.applyFilters).toHaveBeenCalledWith(jasmine.objectContaining({ status: 'active' }));
  });

  it('should return true from hasActiveFilters when chips exist', () => {
    component.filterChips = [{ key: 'cellType', label: 'test', value: 'PLASM' }];
    expect(component.hasActiveFilters()).toBe(true);
  });

  it('should return false from hasActiveFilters when no chips', () => {
    component.filterChips = [];
    expect(component.hasActiveFilters()).toBe(false);
  });

  it('should clear all filters and reload', () => {
    spyOn(component, 'loadData');
    component.appliedFilters = { cellType: 'PLASM', status: 'all' };
    component.filterChips = [{ key: 'cellType', label: 'test', value: 'PLASM' }];
    component.tableConfig.pagination!.pageIndex = 5;
    component.clearAllFilters();
    expect(component.appliedFilters.cellType).toBeNull();
    expect(component.appliedFilters.status).toBe('active');
    expect(component.filterChips.length).toBe(0);
    expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should call createRecord on Alt+C', () => {
    spyOn(component, 'createRecord');
    component.handleKeyboardShortcut(new KeyboardEvent('keydown', { altKey: true, key: 'c' }));
    expect(component.createRecord).toHaveBeenCalled();
  });

  it('should handle Alt+S keyboard shortcut', () => {
    component.handleKeyboardShortcut(new KeyboardEvent('keydown', { altKey: true, key: 's' }));
  });

  it('should handle Alt+S when searchBarComponent is not set', () => {
    component.searchBarComponent = undefined as any;
    component.handleKeyboardShortcut(new KeyboardEvent('keydown', { altKey: true, key: 's' }));
  });

  it('should handle Alt+F keyboard shortcut', () => {
    spyOn(component, 'openFilter');
    component.handleKeyboardShortcut(new KeyboardEvent('keydown', { altKey: true, key: 'f' }));
    expect(component.openFilter).toHaveBeenCalled();
  });

  it('should dispose overlay on Escape when overlay exists', () => {
    const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
    (component as any).overlayRef = mockOverlayRef;
    component.filterBtn = new ElementRef(document.createElement('button'));
    component.handleKeyboardShortcut(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(mockOverlayRef.dispose).toHaveBeenCalled();
    expect((component as any).overlayRef).toBeNull();
    expect(component.isFilterOpen).toBe(false);
  });

  it('should close side panel on Escape when panel is open and no overlay', () => {
    (component as any).overlayRef = null;
    component.sidePanelOpen = true;
    component.handleKeyboardShortcut(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.sidePanelOpen).toBe(false);
  });

  it('should show snackbar when loadFilterOptions fails', () => {
    spyOn((component as any).snackBar, 'open');
    mockService.getFilterOptions.and.returnValue(throwError(() => new Error('fail')));
    (component as any).loadFilterOptions();
    expect((component as any).snackBar.open).toHaveBeenCalled();
  });

  it('should format weight columns correctly', () => {
    const cols = component.tableConfig.columns;
    const minW = cols.find(c => c.key === 'minWeight');
    const maxW = cols.find(c => c.key === 'maxWeight');
    expect((minW as any).valueFormatter(null)).toBe('-');
    expect((minW as any).valueFormatter(110)).toBe(110);
    expect((maxW as any).valueFormatter(null)).toBe('-');
    expect((maxW as any).valueFormatter(200)).toBe(200);
  });

  it('should format date columns correctly', () => {
    const cols = component.tableConfig.columns;
    const effDate = cols.find(c => c.key === 'effectiveDate');
    const termDate = cols.find(c => c.key === 'terminationDate');
    expect((effDate as any).valueFormatter(null)).toBe('-');
    expect((effDate as any).valueFormatter('2020-01-01T00:00:00')).toBeTruthy();
    expect((termDate as any).valueFormatter(null)).toBe('-');
    expect((termDate as any).valueFormatter('2020-01-01T00:00:00')).toBeTruthy();
  });

  it('should debounce search and reload data', fakeAsync(() => {
    spyOn(component, 'loadData');
    component.onSearch('plasma');
    tick(300);
    expect(component.searchText).toBe('plasma');
    expect(component.loadData).toHaveBeenCalled();
  }));

  it('should use cellTypeOptions label in filter chip', () => {
    component.cellTypeOptions = [{ value: 'PLASM', label: 'Plasma' }] as any;
    component.applyFilters({ cellType: 'PLASM', status: 'active' });
    expect(component.filterChips[0].label).toBe('Cell Type: Plasma');
  });

  it('should not add chips when no filters selected', () => {
    component.applyFilters({ status: 'active' });
    expect(component.filterChips.length).toBe(0);
  });

  it('should handle null response in loadData', () => {
    mockService.getRecords.and.returnValue(of(null as any));
    component.loadData();
    expect(component.dataSource).toEqual([]);
    expect(component.tableConfig.pagination!.totalRecords).toBe(0);
  });

  it('should handle row action when dataTableComponent is not set', () => {
    component.dataTableComponent = undefined as any;
    mockService.getRecordByAuditKey.and.returnValue(of(mockRecords[0]));
    component.onRowAction({ action: 'edit', row: mockRecords[0] } as any);
    expect(component.sidePanelMode).toBe('edit');
  });

  it('should dispose overlay on Escape even without filterBtn', () => {
    const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
    (component as any).overlayRef = mockOverlayRef;
    (component as any).filterBtn = undefined;
    component.handleKeyboardShortcut(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(mockOverlayRef.dispose).toHaveBeenCalled();
    expect((component as any).overlayRef).toBeNull();
  });

  it('should handle applyFilters with no status', () => {
    component.applyFilters({ cellType: null });
    expect(component.filterChips.length).toBe(0);
  });

  it('should handle onRowAction with non-edit action', () => {
    mockService.getRecordByAuditKey.and.returnValue(of(mockRecords[0]));
    component.onRowAction({ action: 'unknown', row: mockRecords[0] } as any);
    expect(component.sidePanelMode).toBe('add');
  });

  it('should dispose existing overlay when openFilter called while open', () => {
    const mockOvRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
    (component as any).overlayRef = mockOvRef;
    component.isFilterOpen = true;
    component.openFilter();
    expect(mockOvRef.dispose).toHaveBeenCalled();
    expect((component as any).overlayRef).toBeNull();
    expect(component.isFilterOpen).toBe(false);
  });

  describe('openFilter overlay management', () => {
    let overlayService: Overlay;
    let mockOvRef: jasmine.SpyObj<any>;
    let applySubject: Subject<any>;
    let closeSubject: Subject<void>;
    let backdropSubject: Subject<any>;
    let filterButton: HTMLButtonElement;

    beforeEach(() => {
      filterButton = document.createElement('button');
      spyOn(filterButton, 'blur');
      component.tableCard = new ElementRef(document.createElement('div'));
      component.filterBtn = new ElementRef(filterButton);
      applySubject = new Subject<any>();
      closeSubject = new Subject<void>();
      backdropSubject = new Subject<any>();
      const mockComponentRef = {
        instance: {
          currentFilters: null as any,
          cellTypeOptions: [] as any[],
          apply: applySubject,
          close: closeSubject
        }
      };
      mockOvRef = jasmine.createSpyObj('OverlayRef', ['attach', 'dispose', 'backdropClick']);
      mockOvRef.attach.and.returnValue(mockComponentRef);
      mockOvRef.backdropClick.and.returnValue(backdropSubject);
      overlayService = (component as any).overlay;
      spyOn(overlayService, 'position').and.returnValue({
        flexibleConnectedTo: () => ({
          withPositions: () => ({
            withPush: () => ({})
          })
        })
      } as any);
      overlayService.scrollStrategies = { block: () => ({}) } as any;
      spyOn(overlayService, 'create').and.returnValue(mockOvRef);
    });

    it('should create overlay and set up filter component', () => {
      component.openFilter();
      expect(component.isFilterOpen).toBe(true);
      expect(overlayService.create).toHaveBeenCalled();
      expect(mockOvRef.attach).toHaveBeenCalled();
    });

    it('should dispose overlay on apply event', () => {
      component.openFilter();
      spyOn(component, 'applyFilters');
      applySubject.next({ cellType: 'RBC', status: 'active' });
      expect(component.applyFilters).toHaveBeenCalledWith({ cellType: 'RBC', status: 'active' });
      expect(mockOvRef.dispose).toHaveBeenCalled();
      expect(component.isFilterOpen).toBe(false);
      expect(filterButton.blur).toHaveBeenCalled();
    });

    it('should dispose overlay on close event', () => {
      component.openFilter();
      closeSubject.next();
      expect(mockOvRef.dispose).toHaveBeenCalled();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should dispose overlay on close event without filterBtn', () => {
      component.filterBtn = undefined as any;
      component.openFilter();
      closeSubject.next();
      expect(mockOvRef.dispose).toHaveBeenCalled();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should dispose overlay on backdrop click', () => {
      component.openFilter();
      backdropSubject.next({} as MouseEvent);
      expect(mockOvRef.dispose).toHaveBeenCalled();
      expect(component.isFilterOpen).toBe(false);
    });
  });

});
