import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { AntigenPricingMatrixComponent } from './antigen-pricing-matrix.component';
import { AntigenPricingMatrixApiService } from './services/antigen-pricing-matrix-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { MenuService } from '@shared/services/menu.service';
import { MatDialog } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { TranslateService } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  createMockSnackbarService,
  createMockTranslateService,
  createMockPageHeaderService,
  createMockMatDialog,
  createMockHeaderService
} from '@shared/testing/common-mocks';
import {
  AntigenPricingMatrixFilterValue,
  AntigenPricingMatrixModel
} from './models/antigen-pricing-matrix.model';
import moment from 'moment';

describe('AntigenPricingMatrixComponent', () => {
  let component: AntigenPricingMatrixComponent;
  let fixture: ComponentFixture<AntigenPricingMatrixComponent>;
  let mockApiService: jasmine.SpyObj<AntigenPricingMatrixApiService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockMenuService: jasmine.SpyObj<MenuService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let chapterChangedSubject: Subject<void>;

  const mockRow: AntigenPricingMatrixModel = {
    code: 'SVCCODE',
    quantity: 2,
    price: 19.99,
    description: 'Test item',
    effDate: '2024-01-01',
    termDate: '2025-01-01'
  };

  const makeFormValue = (overrides = {}) => ({
    code: 'NEWCODE',
    quantity: 1,
    price: 10.00,
    description: 'desc',
    effDate: moment('2025-01-01') as any,
    termDate: null,
    ...overrides
  });

  beforeEach(async () => {
    chapterChangedSubject = new Subject<void>();

    mockApiService = jasmine.createSpyObj('AntigenPricingMatrixApiService', [
      'getAntigenPricingMatrix',
      'createAntigenPricingMatrix',
      'updateAntigenPricingMatrix',
      'deleteAntigenPricingMatrix',
      'getAddDropdown',
      'getFilterDropdownValues'
    ]);
    mockLoggingService = jasmine.createSpyObj('LoggingService', ['error']);
    mockSnackbarService = createMockSnackbarService();
    mockHeaderService = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });
    mockPageHeaderService = createMockPageHeaderService();
    mockMenuService = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);
    mockDialog = createMockMatDialog();
    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position', 'scrollStrategies']);
    mockTranslateService = createMockTranslateService();

    mockApiService.getAntigenPricingMatrix.and.returnValue(of({ data: [], totalCount: 0 }));
    mockApiService.getFilterDropdownValues.and.returnValue(of([]));
    mockApiService.createAntigenPricingMatrix.and.returnValue(of({} as any));
    mockApiService.updateAntigenPricingMatrix.and.returnValue(of({} as any));
    mockMenuService.getMenuItemsSignal.and.returnValue(signal([]));

    await TestBed.configureTestingModule({
      imports: [AntigenPricingMatrixComponent, NoopAnimationsModule],
      providers: [
        { provide: AntigenPricingMatrixApiService, useValue: mockApiService },
        { provide: LoggingService, useValue: mockLoggingService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: MenuService, useValue: mockMenuService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: Overlay, useValue: mockOverlay },
        { provide: TranslateService, useValue: mockTranslateService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AntigenPricingMatrixComponent);
    component = fixture.componentInstance;
  });

  // ── ngOnInit ──────────────────────────────────────────────────────────────

  it('should load data on init', () => {
    expect(mockApiService.getAntigenPricingMatrix).not.toHaveBeenCalled();
    fixture.detectChanges();
    expect(mockApiService.getAntigenPricingMatrix).toHaveBeenCalled();
  });

  // ── loadInitialFilterOptions ───────────────────────────────────────────────

  it('should populate uniqueServiceCodes sorted from filter dropdown load', () => {
    mockApiService.getFilterDropdownValues.and.returnValue(of(['B', 'A', 'C']));

    fixture.detectChanges();

    expect(component.uniqueServiceCodes).toEqual(['A', 'B', 'C']);
  });

  it('should set uniqueServiceCodes to empty array and log error when filter options load fails', () => {
    mockApiService.getFilterDropdownValues.and.returnValue(throwError(() => new Error('network error')));

    fixture.detectChanges();

    expect(component.uniqueServiceCodes).toEqual([]);
    expect(mockLoggingService.error).toHaveBeenCalled();
  });

  // ── loadData ──────────────────────────────────────────────────────────────

  it('should populate dataSource and totalRecords on successful load', () => {
    mockApiService.getAntigenPricingMatrix.and.returnValue(of({
      data: [mockRow],
      totalCount: 1
    }));

    fixture.detectChanges();

    expect(component.dataSource).toContain(mockRow);
    expect(component.tableConfig.pagination!.totalRecords).toBe(1);
    expect(component.isLoading).toBeFalse();
  });

  it('should set hasError and errorMessage when loadData fails', () => {
    mockApiService.getAntigenPricingMatrix.and.returnValue(throwError(() => new Error('fail')));

    fixture.detectChanges();

    expect(component.hasError).toBeTrue();
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBeTruthy();
    expect(mockLoggingService.error).toHaveBeenCalled();
  });

  it('should pass skip based on pageIndex and pageSize to loadData', () => {
    fixture.detectChanges();
    component.tableConfig.pagination!.pageIndex = 2;
    component.tableConfig.pagination!.pageSize = 10;
    mockApiService.getAntigenPricingMatrix.calls.reset();

    component.loadData();

    const [take, skip] = mockApiService.getAntigenPricingMatrix.calls.mostRecent().args as [number, number, any];
    expect(take).toBe(10);
    expect(skip).toBe(20);
  });

  it('should include sortColumn and sortOrder in query when set', () => {
    fixture.detectChanges();
    component.requestState.sortColumn = 'ServiceCode';
    component.requestState.sortOrder = 'ASC';
    mockApiService.getAntigenPricingMatrix.calls.reset();

    component.loadData();

    const [, , queryDto] = mockApiService.getAntigenPricingMatrix.calls.mostRecent().args as [number, number, any];
    expect(queryDto.sortColumn).toBe('ServiceCode');
    expect(queryDto.sortOrder).toBe('ASC');
  });

  // ── onSearch ─────────────────────────────────────────────────────────────

  it('should set searchKeyword and reset pageIndex on search', () => {
    fixture.detectChanges();
    component.tableConfig.pagination!.pageIndex = 3;
    mockApiService.getAntigenPricingMatrix.calls.reset();

    component.onSearch('myquery');

    expect(component.requestState.searchKeyword).toBe('myquery');
    expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    expect(mockApiService.getAntigenPricingMatrix).toHaveBeenCalled();
  });

  it('should set searchKeyword to undefined when search text is empty', () => {
    fixture.detectChanges();
    component.requestState.searchKeyword = 'old';

    component.onSearch('');

    expect(component.requestState.searchKeyword).toBeUndefined();
  });

  // ── onPageChange ──────────────────────────────────────────────────────────

  it('should update pageIndex, pageSize and reload data on page change', () => {
    fixture.detectChanges();
    mockApiService.getAntigenPricingMatrix.calls.reset();

    component.onPageChange({ pageIndex: 2, pageSize: 50, previousPageIndex: 1 });

    expect(component.tableConfig.pagination!.pageIndex).toBe(2);
    expect(component.tableConfig.pagination!.pageSize).toBe(50);
    expect(mockApiService.getAntigenPricingMatrix).toHaveBeenCalled();
  });

  // ── onSortChange ──────────────────────────────────────────────────────────

  it('should set direction to A when clicking a new column', () => {
    fixture.detectChanges();

    component.onSortChange({ column: 'code', direction: 'default' });

    expect(component.tableConfig.sortConfig!.direction).toBe('A');
    expect(component.requestState.sortColumn).toBe('ServiceCode');
    expect(component.requestState.sortOrder).toBe('ASC');
  });

  it('should cycle A → D when clicking same column again', () => {
    fixture.detectChanges();
    component.tableConfig.sortConfig!.column = 'code';
    component.tableConfig.sortConfig!.direction = 'A';

    component.onSortChange({ column: 'code', direction: 'default' });

    expect(component.tableConfig.sortConfig!.direction).toBe('D');
    expect(component.requestState.sortOrder).toBe('DESC');
  });

  it('should cycle D → default when clicking same column a third time', () => {
    fixture.detectChanges();
    component.tableConfig.sortConfig!.column = 'code';
    component.tableConfig.sortConfig!.direction = 'D';

    component.onSortChange({ column: 'code', direction: 'default' });

    expect(component.tableConfig.sortConfig!.direction).toBe('default');
    expect(component.requestState.sortColumn).toBeUndefined();
    expect(component.requestState.sortOrder).toBeUndefined();
  });

  it('should map "code" column to "ServiceCode" for API', () => {
    fixture.detectChanges();

    component.onSortChange({ column: 'code', direction: 'default' });

    expect(component.requestState.sortColumn).toBe('ServiceCode');
  });

  it('should pass column name directly for non-code columns', () => {
    fixture.detectChanges();

    component.onSortChange({ column: 'price', direction: 'default' });

    expect(component.requestState.sortColumn).toBe('price');
  });

  it('should start A when clicking a different column while another is sorted', () => {
    fixture.detectChanges();
    component.tableConfig.sortConfig!.column = 'code';
    component.tableConfig.sortConfig!.direction = 'A';

    component.onSortChange({ column: 'price', direction: 'default' });

    expect(component.tableConfig.sortConfig!.direction).toBe('A');
    expect(component.tableConfig.sortConfig!.column).toBe('price');
  });

  // ── onRowAction ───────────────────────────────────────────────────────────

  it('should call openEditDialog when edit row action fires', () => {
    fixture.detectChanges();
    spyOn(component, 'openEditDialog');

    component.onRowAction({ action: 'edit', row: mockRow });

    expect(component.openEditDialog).toHaveBeenCalledWith(mockRow);
  });

  // ── openEditDialog / openAddDialog / closeSidePanel ───────────────────────

  it('should set sidePanelMode to edit, assign data, and open panel', () => {
    fixture.detectChanges();

    component.openEditDialog(mockRow);

    expect(component.sidePanelMode).toBe('edit');
    expect(component.sidePanelData).toBe(mockRow);
    expect(component.sidePanelOpen).toBeTrue();
  });

  it('should set sidePanelMode to add and open panel after timeout', fakeAsync(() => {
    fixture.detectChanges();

    component.openAddDialog();
    tick();

    expect(component.sidePanelMode).toBe('add');
    expect(component.sidePanelOpen).toBeTrue();
  }));

  it('should close side panel and clear data when closeSidePanel is called', () => {
    fixture.detectChanges();
    component.sidePanelOpen = true;
    component.sidePanelData = mockRow;

    component.closeSidePanel();

    expect(component.sidePanelOpen).toBeFalse();
    expect(component.sidePanelData).toBeNull();
  });

  // ── applyFilters ──────────────────────────────────────────────────────────

  it('should update appliedFilters, filterChips, and requestState when applyFilters is called', () => {
    fixture.detectChanges();
    const filters: AntigenPricingMatrixFilterValue = { serviceCode: 'ABC' };

    component.applyFilters(filters);

    expect(component.appliedFilters).toEqual(filters);
    expect(component.filterChips.length).toBeGreaterThan(0);
    expect(component.requestState.serviceCode).toBe('ABC');
    expect(component.tableConfig.pagination!.pageIndex).toBe(0);
  });

  it('should update requestState with date filters from applyFilters', () => {
    fixture.detectChanges();
    const filters: AntigenPricingMatrixFilterValue = {
      effDatePeriod: 'before',
      effDate: '2025-01-01',
      termDatePeriod: 'after',
      termDate: '2025-06-01'
    };

    component.applyFilters(filters);

    expect(component.requestState.effDatePeriod).toBe('before');
    expect(component.requestState.effDate).toBe('2025-01-01');
    expect(component.requestState.termDatePeriod).toBe('after');
    expect(component.requestState.termDate).toBe('2025-06-01');
  });

  it('should reload data after applying filters', () => {
    fixture.detectChanges();
    mockApiService.getAntigenPricingMatrix.calls.reset();

    component.applyFilters({ serviceCode: 'XYZ' });

    expect(mockApiService.getAntigenPricingMatrix).toHaveBeenCalled();
  });

  // ── onRemoveFilterChip ────────────────────────────────────────────────────

  it('should remove filter chip and reload data', () => {
    fixture.detectChanges();
    component.appliedFilters = { serviceCode: 'ABC' };
    mockApiService.getAntigenPricingMatrix.calls.reset();

    component.onRemoveFilterChip('serviceCode');

    expect(mockApiService.getAntigenPricingMatrix).toHaveBeenCalled();
    expect(component.tableConfig.pagination!.pageIndex).toBe(0);
  });

  it('should set appliedFilters to null when removing the last active filter chip', () => {
    fixture.detectChanges();
    component.appliedFilters = { serviceCode: 'ABC' };

    component.onRemoveFilterChip('serviceCode');

    expect(component.appliedFilters).toBeNull();
  });

  // ── hasActiveFilters ──────────────────────────────────────────────────────

  it('should return false from hasActiveFilters when appliedFilters is null', () => {
    fixture.detectChanges();
    component.appliedFilters = null;

    expect(component.hasActiveFilters()).toBeFalse();
  });

  it('should return true from hasActiveFilters when a filter is active', () => {
    fixture.detectChanges();
    component.appliedFilters = { serviceCode: 'XYZ' };

    expect(component.hasActiveFilters()).toBeTrue();
  });

  // ── clearAllFilters ───────────────────────────────────────────────────────

  it('should clear filters but preserve search keyword and sort state', () => {
    fixture.detectChanges();
    component.appliedFilters = { serviceCode: 'ABC' };
    component.requestState.searchKeyword = 'mysearch';
    component.requestState.sortColumn = 'code';
    component.requestState.sortOrder = 'ASC';
    mockApiService.getAntigenPricingMatrix.calls.reset();

    component.clearAllFilters();

    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips).toEqual([]);
    expect(component.requestState.searchKeyword).toBe('mysearch');
    expect(component.requestState.sortColumn).toBe('code');
    expect(component.requestState.serviceCode).toBeUndefined();
    expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    expect(mockApiService.getAntigenPricingMatrix).toHaveBeenCalled();
  });

  // ── onSave — add mode ─────────────────────────────────────────────────────

  it('should call createAntigenPricingMatrix and close panel on save in add mode', () => {
    fixture.detectChanges();
    component.sidePanelMode = 'add';
    component.sidePanelOpen = true;

    component.onSave(makeFormValue());

    expect(mockApiService.createAntigenPricingMatrix).toHaveBeenCalled();
    expect(mockSnackbarService.showSuccess).toHaveBeenCalled();
    expect(component.sidePanelOpen).toBeFalse();
  });

  it('should include formatted termDate in create payload when termDate is provided', () => {
    fixture.detectChanges();
    component.sidePanelMode = 'add';

    component.onSave(makeFormValue({ termDate: moment('2025-12-31') as any }));

    const dto = mockApiService.createAntigenPricingMatrix.calls.mostRecent().args[0] as any;
    expect(dto.termDate).toBeTruthy();
  });

  it('should set termDate to undefined in create payload when not provided', () => {
    fixture.detectChanges();
    component.sidePanelMode = 'add';

    component.onSave(makeFormValue({ termDate: null }));

    const dto = mockApiService.createAntigenPricingMatrix.calls.mostRecent().args[0] as any;
    expect(dto.termDate).toBeUndefined();
  });

  it('should keep panel open after saveAndCreateAnother succeeds in add mode', () => {
    fixture.detectChanges();
    component.sidePanelMode = 'add';
    component.sidePanelOpen = true;

    component.onSaveAndCreateAnother(makeFormValue());

    expect(mockApiService.createAntigenPricingMatrix).toHaveBeenCalled();
    expect(mockSnackbarService.showSuccess).toHaveBeenCalled();
    expect(component.sidePanelOpen).toBeTrue();
  });

  it('should not close panel when createAntigenPricingMatrix fails in add mode', () => {
    mockApiService.createAntigenPricingMatrix.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    component.sidePanelMode = 'add';
    component.sidePanelOpen = true;

    component.onSave(makeFormValue());

    expect(component.sidePanelOpen).toBeTrue();
  });

  it('should default price to 0.00 when price is null in add mode', () => {
    fixture.detectChanges();
    component.sidePanelMode = 'add';

    component.onSave(makeFormValue({ price: null }));

    const dto = mockApiService.createAntigenPricingMatrix.calls.mostRecent().args[0] as any;
    expect(dto.price).toBe(0.00);
  });

  // ── onSave — edit mode ────────────────────────────────────────────────────

  it('should call updateAntigenPricingMatrix with original composite key in edit mode', () => {
    fixture.detectChanges();
    component.sidePanelMode = 'edit';
    component.sidePanelData = mockRow;
    component.sidePanelOpen = true;

    component.onSave(makeFormValue({ code: 'SVCCODE', quantity: 2 }));

    expect(mockApiService.updateAntigenPricingMatrix).toHaveBeenCalledWith(
      mockRow.code,
      mockRow.quantity,
      mockRow.effDate,
      jasmine.any(Object)
    );
    expect(mockSnackbarService.showSuccess).toHaveBeenCalled();
    expect(component.sidePanelOpen).toBeFalse();
  });

  it('should not close panel when updateAntigenPricingMatrix fails in edit mode', () => {
    mockApiService.updateAntigenPricingMatrix.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    component.sidePanelMode = 'edit';
    component.sidePanelData = mockRow;
    component.sidePanelOpen = true;

    component.onSave(makeFormValue());

    expect(component.sidePanelOpen).toBeTrue();
  });

  it('should include termDate in update payload when provided', () => {
    fixture.detectChanges();
    component.sidePanelMode = 'edit';
    component.sidePanelData = mockRow;

    component.onSave(makeFormValue({ termDate: moment('2025-12-31') as any }));

    const dto = (mockApiService.updateAntigenPricingMatrix.calls.mostRecent().args as any[])[3];
    expect(dto.termDate).toBeTruthy();
  });

  // ── handleKeyboardShortcut ────────────────────────────────────────────────

  it('should focus search bar on Alt+S', () => {
    fixture.detectChanges();
    const mockSearchBar = jasmine.createSpyObj('SearchBar', ['focus']);
    component.searchBarComponent = mockSearchBar;

    const event = new KeyboardEvent('keydown', { altKey: true, key: 's' });
    spyOn(event, 'preventDefault');
    component.handleKeyboardShortcut(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(mockSearchBar.focus).toHaveBeenCalled();
  });

  it('should call openFilter on Alt+F', () => {
    fixture.detectChanges();
    spyOn(component, 'openFilter');

    const event = new KeyboardEvent('keydown', { altKey: true, key: 'f' });
    spyOn(event, 'preventDefault');
    component.handleKeyboardShortcut(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.openFilter).toHaveBeenCalled();
  });

  it('should close overlay on Escape when overlayRef exists', () => {
    fixture.detectChanges();
    const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose', 'backdropClick']);
    mockOverlayRef.backdropClick.and.returnValue(of(null));
    component['overlayRef'] = mockOverlayRef;

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    spyOn(event, 'preventDefault');
    component.handleKeyboardShortcut(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(mockOverlayRef.dispose).toHaveBeenCalled();
    expect(component.isFilterOpen).toBeFalse();
  });

  it('should not call preventDefault for unrelated keys', () => {
    fixture.detectChanges();

    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    spyOn(event, 'preventDefault');
    component.handleKeyboardShortcut(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  // ── closeOverlay / openFilter toggle ─────────────────────────────────────

  it('should dispose existing overlayRef when openFilter is called while filter is open', () => {
    fixture.detectChanges();
    const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose', 'backdropClick']);
    mockOverlayRef.backdropClick.and.returnValue(of(null));
    component['overlayRef'] = mockOverlayRef;

    component.openFilter();

    expect(mockOverlayRef.dispose).toHaveBeenCalled();
    expect(component['overlayRef']).toBeNull();
    expect(component.isFilterOpen).toBeFalse();
  });

  // ── subscribeToChapterChanges ─────────────────────────────────────────────

  it('should reload data and filter options when chapter changes', () => {
    fixture.detectChanges();
    mockApiService.getAntigenPricingMatrix.calls.reset();

    chapterChangedSubject.next();

    expect(mockApiService.getAntigenPricingMatrix).toHaveBeenCalled();
  });

  it('should close side panel when chapter changes', () => {
    fixture.detectChanges();
    component.sidePanelOpen = true;
    component.sidePanelData = mockRow;

    chapterChangedSubject.next();

    expect(component.sidePanelOpen).toBeFalse();
    expect(component.sidePanelData).toBeNull();
  });

  // ── ngOnDestroy ───────────────────────────────────────────────────────────

  it('should complete destroy$ and dispose overlayRef on destroy', () => {
    fixture.detectChanges();
    const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
    component['overlayRef'] = mockOverlayRef;
    const nextSpy = spyOn(component['destroy$'], 'next');

    component.ngOnDestroy();

    expect(nextSpy).toHaveBeenCalled();
    expect(mockOverlayRef.dispose).toHaveBeenCalled();
  });

  it('should not throw on destroy when overlayRef is null', () => {
    fixture.detectChanges();
    component['overlayRef'] = null;

    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
