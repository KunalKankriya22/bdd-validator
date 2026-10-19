import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import { ValidCatalogNumbersComponent } from './valid-catalog-numbers';
import { ValidCatalogNumbersService } from './services/valid-catalog-numbers.service';
import { HeaderService } from '@shared/services/header.service';
import {
  ValidCatalogDto,
  ValidCatalogFilterValue,
  CreateValidCatalogDto,
  UpdateValidCatalogDto,
  PaginatedResponse,
} from './models/valid-catalog-numbers.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { Router } from '@angular/router';

// Helper to build a mock catalog row
function makeCatalog(overrides: Partial<ValidCatalogDto> = {}): ValidCatalogDto {
  return {
    catalogNumber: 'CAT001',
    manufacturerCode: 'MFR1',
    manufacturer: 'Test Manufacturer',
    totalBagsInSet: 3,
    numberOfProds: 2,
    bagType: 'SINGLE',
    bagVolume: 500,
    weightOfBag: 10,
    collectionVolume: 450,
    anticoagulant: 'CPD',
    additiveSolution: 'AS-1',
    instSpecificCode: null,
    bagStorageRestriction: null,
    effDate: '2024-01-15',
    termDate: null,
    ...overrides,
  };
}

function makeOverlayRefSpy(): jasmine.SpyObj<any> {
  return jasmine.createSpyObj('OverlayRef', ['dispose']);
}

describe('ValidCatalogNumbersComponent', () => {
  let component: ValidCatalogNumbersComponent;
  let fixture: ComponentFixture<ValidCatalogNumbersComponent>;
  let catalogServiceSpy: jasmine.SpyObj<ValidCatalogNumbersService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let routerNavigateSpy: jasmine.Spy;
  let chapterChanged$: Subject<void>;
  let headerServiceStub: any;

  const emptyPageResponse: PaginatedResponse<ValidCatalogDto> = { items: [], totalRecords: 0 };
  const singlePageResponse: PaginatedResponse<ValidCatalogDto> = {
    items: [makeCatalog()],
    totalRecords: 1,
  };

  beforeEach(async () => {
    catalogServiceSpy = jasmine.createSpyObj('ValidCatalogNumbersService', [
      'getValidCatalogs',
      'getFilterCatalogNumbers',
      'getManufacturers',
      'getFilterManufacturers',
      'getAnticoagulants',
      'getAdditives',
      'createValidCatalog',
      'updateValidCatalog',
    ]);

    // Default service returns
    catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
    catalogServiceSpy.getFilterCatalogNumbers.and.returnValue(of([]));
    catalogServiceSpy.getManufacturers.and.returnValue(of([]));
    catalogServiceSpy.getFilterManufacturers.and.returnValue(of([]));
    catalogServiceSpy.getAnticoagulants.and.returnValue(of([]));
    catalogServiceSpy.getAdditives.and.returnValue(of([]));

    chapterChanged$ = new Subject<void>();
    headerServiceStub = {
      chapterChanged$,
      chapterTimeZone: signal('UTC'),
      getCurrentChapterTimezone: () => 'UTC',
    };

    snackbarServiceSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [
        ValidCatalogNumbersComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: ValidCatalogNumbersService, useValue: catalogServiceSpy },
        { provide: HeaderService, useValue: headerServiceStub },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ValidCatalogNumbersComponent);
    component = fixture.componentInstance;

    routerNavigateSpy = spyOn((component as any).router, 'navigate');

    try { fixture.detectChanges(); } catch (_) { /* template dependencies */ }
  });

  afterEach(() => {
    // Ensure filterOverlayRef is properly cleaned up before Angular destroys the component
    if (component.filterOverlayRef && !(component.filterOverlayRef as any).dispose) {
      component.filterOverlayRef = null;
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------
  // loadData
  // ---------------------------------------------------------------
  describe('loadData', () => {
    it('should set isLoading true then false on success', () => {
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(singlePageResponse));
      component.loadData();
      expect(component.isLoading).toBeFalse();
      expect(component.dataSource.length).toBe(1);
    });

    it('should format effDate and termDate for display', () => {
      const response: PaginatedResponse<ValidCatalogDto> = {
        items: [makeCatalog({ effDate: '2024-01-15', termDate: '2025-06-30' })],
        totalRecords: 1,
      };
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(response));
      component.loadData();
      expect(component.dataSource[0].effDate).toBe('15-JAN-2024');
      expect(component.dataSource[0].termDate).toBe('30-JUN-2025');
    });

    it('should handle null dates gracefully', () => {
      const response: PaginatedResponse<ValidCatalogDto> = {
        items: [makeCatalog({ effDate: null, termDate: null })],
        totalRecords: 1,
      };
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(response));
      component.loadData();
      expect(component.dataSource[0].effDate).toBeNull();
      expect(component.dataSource[0].termDate).toBeNull();
    });

    it('should set totalRecords from response', () => {
      const response: PaginatedResponse<ValidCatalogDto> = {
        items: [makeCatalog()],
        totalRecords: 42,
      };
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(response));
      component.loadData();
      expect(component.dataTableConfig.pagination?.totalRecords).toBe(42);
    });

    it('should reset data on error', () => {
      catalogServiceSpy.getValidCatalogs.and.returnValue(throwError(() => new Error('fail')));
      component.loadData();
      expect(component.dataSource).toEqual([]);
      expect(component.isLoading).toBeFalse();
      expect(component.dataTableConfig.pagination?.totalRecords).toBe(0);
    });

    it('should pass sort parameters when sortConfig is set with direction A', () => {
      component.dataTableConfig.sortConfig = { column: 'catalogNumber', direction: 'A' };
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.loadData();
      const callArgs = catalogServiceSpy.getValidCatalogs.calls.mostRecent().args;
      expect(callArgs[2]?.sortColumn).toBe('CATALOG_NUMBER');
      expect(callArgs[2]?.sortOrder).toBe('ASC');
    });

    it('should pass DESC when sortDir is D', () => {
      component.dataTableConfig.sortConfig = { column: 'manufacturer', direction: 'D' };
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.loadData();
      const callArgs = catalogServiceSpy.getValidCatalogs.calls.mostRecent().args;
      expect(callArgs[2]?.sortColumn).toBe('MANUFACTURER');
      expect(callArgs[2]?.sortOrder).toBe('DESC');
    });

    it('should not pass sort when direction is default', () => {
      component.dataTableConfig.sortConfig = { column: 'catalogNumber', direction: 'default' };
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.loadData();
      const callArgs = catalogServiceSpy.getValidCatalogs.calls.mostRecent().args;
      expect(callArgs[2]?.sortColumn).toBeUndefined();
      expect(callArgs[2]?.sortOrder).toBeUndefined();
    });

    it('should pass unmapped sort column name when not in map', () => {
      component.dataTableConfig.sortConfig = { column: 'bagVolume', direction: 'A' };
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.loadData();
      const callArgs = catalogServiceSpy.getValidCatalogs.calls.mostRecent().args;
      expect(callArgs[2]?.sortColumn).toBe('bagVolume');
    });

    it('should map manufacturerCode sort column', () => {
      component.dataTableConfig.sortConfig = { column: 'manufacturerCode', direction: 'A' };
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.loadData();
      const callArgs = catalogServiceSpy.getValidCatalogs.calls.mostRecent().args;
      expect(callArgs[2]?.sortColumn).toBe('MANUFACTURER_CODE');
    });

    it('should pass searchKeyword when set', () => {
      component.searchKeyword = 'test';
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.loadData();
      const callArgs = catalogServiceSpy.getValidCatalogs.calls.mostRecent().args;
      expect(callArgs[2]?.searchKeyword).toBe('test');
    });

    it('should not pass searchKeyword when empty', () => {
      component.searchKeyword = '';
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.loadData();
      const callArgs = catalogServiceSpy.getValidCatalogs.calls.mostRecent().args;
      expect(callArgs[2]?.searchKeyword).toBeUndefined();
    });

    it('should pass all filter params when appliedFilters is fully populated', () => {
      component.appliedFilters = {
        catalogNumber: 'CAT001',
        manufacturerCode: 'MFR1',
        manufacturer: 'Test',
        showTerminated: true,
        effDate: '2024-01-01',
        effDatePeriod: 'after',
        termDate: '2025-12-31',
        termDatePeriod: 'before',
      };
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.loadData();
      const callArgs = catalogServiceSpy.getValidCatalogs.calls.mostRecent().args;
      expect(callArgs[2]?.catalogNumber).toBe('CAT001');
      expect(callArgs[2]?.manufacturerCode).toBe('MFR1');
      expect(callArgs[2]?.manufacturer).toBe('Test');
      expect(callArgs[2]?.showTerminated).toBe('Y');
      expect(callArgs[2]?.effDate).toBe('2024-01-01');
      expect(callArgs[2]?.effDatePeriod).toBe('after');
      expect(callArgs[2]?.termDate).toBe('2025-12-31');
      expect(callArgs[2]?.termDatePeriod).toBe('before');
    });

    it('should pass showTerminated N when false', () => {
      component.appliedFilters = { showTerminated: false };
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.loadData();
      const callArgs = catalogServiceSpy.getValidCatalogs.calls.mostRecent().args;
      expect(callArgs[2]?.showTerminated).toBe('N');
    });

    it('should not pass showTerminated when undefined', () => {
      component.appliedFilters = { catalogNumber: 'X' };
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.loadData();
      const callArgs = catalogServiceSpy.getValidCatalogs.calls.mostRecent().args;
      expect(callArgs[2]?.showTerminated).toBeUndefined();
    });

    it('should handle response with no items property gracefully', () => {
      const response = { items: undefined as any, totalRecords: 0 };
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(response));
      component.loadData();
      expect(component.dataSource).toEqual([]);
    });

    it('should handle response with no totalRecords', () => {
      const response = { items: [], totalRecords: undefined as any };
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(response));
      component.loadData();
      expect(component.dataTableConfig.pagination?.totalRecords).toBe(0);
    });
  });

  // ---------------------------------------------------------------
  // onSearch
  // ---------------------------------------------------------------
  describe('onSearch', () => {
    it('should set searchKeyword and call loadData for valid search', () => {
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.onSearch('test keyword');
      expect(component.searchKeyword).toBe('test keyword');
    });

    it('should not search when keyword is less than 2 chars', () => {
      const prevKeyword = component.searchKeyword;
      component.onSearch('a');
      expect(component.searchKeyword).toBe(prevKeyword);
    });

    it('should allow empty search (clear)', () => {
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.onSearch('');
      expect(component.searchKeyword).toBe('');
    });

    it('should trim the keyword', () => {
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.onSearch('  hello  ');
      expect(component.searchKeyword).toBe('hello');
    });

    it('should reset pageIndex to 0', () => {
      if (component.dataTableConfig.pagination) {
        component.dataTableConfig.pagination.pageIndex = 5;
      }
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.onSearch('search');
      expect(component.dataTableConfig.pagination?.pageIndex).toBe(0);
    });

    it('should handle null keyword', () => {
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.onSearch(null as any);
      expect(component.searchKeyword).toBe('');
    });
  });

  // ---------------------------------------------------------------
  // onPageChange
  // ---------------------------------------------------------------
  describe('onPageChange', () => {
    it('should update pagination and call loadData', () => {
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.onPageChange({ pageIndex: 2, pageSize: 50 });
      expect(component.dataTableConfig.pagination?.pageIndex).toBe(2);
      expect(component.dataTableConfig.pagination?.pageSize).toBe(50);
    });
  });

  // ---------------------------------------------------------------
  // onSortChange
  // ---------------------------------------------------------------
  describe('onSortChange', () => {
    it('should update sortConfig when it exists', () => {
      component.dataTableConfig.sortConfig = { column: '', direction: 'default' };
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.onSortChange({ column: 'manufacturer', direction: 'A' });
      expect(component.dataTableConfig.sortConfig?.column).toBe('manufacturer');
      expect(component.dataTableConfig.sortConfig?.direction).toBe('A');
    });

    it('should call loadData even when sortConfig does not exist', () => {
      component.dataTableConfig.sortConfig = undefined;
      catalogServiceSpy.getValidCatalogs.calls.reset();
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.onSortChange({ column: 'x', direction: 'D' });
      expect(catalogServiceSpy.getValidCatalogs).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // onRowAction
  // ---------------------------------------------------------------
  describe('onRowAction', () => {
    let openEditSpy: jasmine.Spy;
    let navigateViewSpy: jasmine.Spy;

    beforeEach(() => {
      openEditSpy = spyOn(component, 'openEditDrawer');
      navigateViewSpy = spyOn(component, 'navigateToView');
    });

    it('should open edit drawer on edit action', () => {
      const row = makeCatalog();
      component.onRowAction({ action: 'edit', row });
      expect(openEditSpy).toHaveBeenCalledWith(row);
    });

    it('should navigate on view action', () => {
      const row = makeCatalog();
      component.onRowAction({ action: 'view', row });
      expect(navigateViewSpy).toHaveBeenCalledWith(row);
    });

    it('should do nothing on unknown action', () => {
      component.onRowAction({ action: 'delete', row: makeCatalog() });
      expect(openEditSpy).not.toHaveBeenCalled();
      expect(navigateViewSpy).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // navigateToView
  // ---------------------------------------------------------------
  describe('navigateToView', () => {
    it('should navigate to catalog view route', () => {
      const catalog = makeCatalog({ catalogNumber: 'C1', manufacturerCode: 'M1' });
      component.navigateToView(catalog);
      expect(routerNavigateSpy).toHaveBeenCalledWith([
        '/laboratory-functions/component-production/catalog-view',
        'C1',
        'M1',
      ]);
    });

    it('should show error snackbar when catalogNumber is missing', () => {
      const catalog = makeCatalog({ catalogNumber: '', manufacturerCode: 'M1' });
      component.navigateToView(catalog);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(routerNavigateSpy).not.toHaveBeenCalled();
    });

    it('should show error snackbar when manufacturerCode is missing', () => {
      const catalog = makeCatalog({ catalogNumber: 'C1', manufacturerCode: '' });
      component.navigateToView(catalog);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(routerNavigateSpy).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // applyFilters
  // ---------------------------------------------------------------
  describe('applyFilters', () => {
    it('should set appliedFilters and filterChips', () => {
      const filters: ValidCatalogFilterValue = { catalogNumber: 'CAT001' };
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.applyFilters(filters);
      expect(component.appliedFilters).toEqual(filters);
      expect(component.filterChips.length).toBeGreaterThan(0);
    });

    it('should reset page index', () => {
      if (component.dataTableConfig.pagination) {
        component.dataTableConfig.pagination.pageIndex = 5;
      }
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.applyFilters({ catalogNumber: 'X' });
      expect(component.dataTableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  // ---------------------------------------------------------------
  // onRemoveFilterChip
  // ---------------------------------------------------------------
  describe('onRemoveFilterChip', () => {
    it('should remove filter and reload data', () => {
      component.appliedFilters = { catalogNumber: 'CAT1', manufacturerCode: 'M1' };
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.onRemoveFilterChip('catalogNumber');
      expect(component.appliedFilters?.catalogNumber).toBeUndefined();
    });

    it('should reset page index', () => {
      component.appliedFilters = { catalogNumber: 'CAT1' };
      if (component.dataTableConfig.pagination) {
        component.dataTableConfig.pagination.pageIndex = 3;
      }
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.onRemoveFilterChip('catalogNumber');
      expect(component.dataTableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  // ---------------------------------------------------------------
  // onClearAllFilters
  // ---------------------------------------------------------------
  describe('onClearAllFilters', () => {
    it('should clear all filters and chips', () => {
      component.appliedFilters = { catalogNumber: 'X' };
      component.filterChips = [{ key: 'catalogNumber', label: 'X', value: 'X' }];
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.onClearAllFilters();
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
    });

    it('should reset page index', () => {
      if (component.dataTableConfig.pagination) {
        component.dataTableConfig.pagination.pageIndex = 5;
      }
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.onClearAllFilters();
      expect(component.dataTableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  // ---------------------------------------------------------------
  // openAddDrawer / openEditDrawer / closeSideDrawer
  // ---------------------------------------------------------------
  describe('side panel operations', () => {
    it('openAddDrawer should set add mode and open panel', () => {
      component.openAddDrawer();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.editingRow).toBeNull();
      expect(component.sidePanelOpen).toBeTrue();
    });

    it('openEditDrawer should set edit mode and populate data', () => {
      const row = makeCatalog();
      component.openEditDrawer(row);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(row);
      expect(component.editingRow).toBe(row);
      expect(component.sidePanelOpen).toBeTrue();
    });

    it('closeSideDrawer should reset panel state', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = makeCatalog();
      component.editingRow = makeCatalog();
      component.closeSideDrawer();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
      expect(component.editingRow).toBeNull();
    });

    it('openAddDrawer should close filter panel if open', () => {
      spyOn(component, 'closeFilterPanel');
      component.openAddDrawer();
      expect(component.closeFilterPanel).toHaveBeenCalled();
    });

    it('openEditDrawer should close filter panel if open', () => {
      spyOn(component, 'closeFilterPanel');
      component.openEditDrawer(makeCatalog());
      expect(component.closeFilterPanel).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // onSave - add mode
  // ---------------------------------------------------------------
  describe('onSave (add mode)', () => {
    const createDto: CreateValidCatalogDto = {
      catalogNumber: 'NEW1',
      manufacturerCode: 'MFR1',
      totalBagsInSet: 3,
      numberOfProds: 2,
      bagType: 'SINGLE',
      bagVolume: 500,
      weightOfBag: 10,
      collectionVolume: 450,
      anticoagulant: 'CPD',
      additiveSolution: 'AS-1',
      instSpecificCode: null,
      bagStorageRestriction: null,
      effDate: '2024-01-01',
      termDate: null,
    };

    beforeEach(() => {
      component.sidePanelMode = 'add';
      catalogServiceSpy.getFilterCatalogNumbers.and.returnValue(of([]));
      catalogServiceSpy.getManufacturers.and.returnValue(of([]));
      catalogServiceSpy.getFilterManufacturers.and.returnValue(of([]));
      catalogServiceSpy.getAnticoagulants.and.returnValue(of([]));
      catalogServiceSpy.getAdditives.and.returnValue(of([]));
    });

    it('should create catalog, show snackbar, close drawer, and reload', () => {
      catalogServiceSpy.createValidCatalog.and.returnValue(of({ success: true } as any));
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.onSave(createDto);
      expect(catalogServiceSpy.createValidCatalog).toHaveBeenCalledWith(createDto);
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should call handleSaveError when API returns success: false', () => {
      const errorResponse = { success: false, errorCode: 'DUP', error: 'Duplicate' };
      catalogServiceSpy.createValidCatalog.and.returnValue(of(errorResponse as any));
      component.onSave(createDto);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });

    it('should call handleSaveError on HTTP error', () => {
      catalogServiceSpy.createValidCatalog.and.returnValue(
        throwError(() => ({ status: 500, error: { message: 'Server error' } }))
      );
      component.onSave(createDto);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // onSave - edit mode
  // ---------------------------------------------------------------
  describe('onSave (edit mode)', () => {
    const updateDto: UpdateValidCatalogDto = {
      originalCatalogNumber: 'CAT001',
      catalogNumber: 'CAT001',
      manufacturerCode: 'MFR1',
      manufacturer: 'Test Manufacturer',
      totalBagsInSet: 3,
      numberOfProds: 2,
      bagType: 'SINGLE',
      bagVolume: 500,
      weightOfBag: 10,
      collectionVolume: 450,
      anticoagulant: 'CPD',
      additiveSolution: 'AS-1',
      instSpecificCode: null,
      bagStorageRestriction: null,
      effDate: '2024-01-01',
      termDate: null,
    };

    beforeEach(() => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = makeCatalog();
      catalogServiceSpy.getFilterCatalogNumbers.and.returnValue(of([]));
      catalogServiceSpy.getManufacturers.and.returnValue(of([]));
      catalogServiceSpy.getFilterManufacturers.and.returnValue(of([]));
      catalogServiceSpy.getAnticoagulants.and.returnValue(of([]));
      catalogServiceSpy.getAdditives.and.returnValue(of([]));
    });

    it('should update catalog and show snackbar', () => {
      catalogServiceSpy.updateValidCatalog.and.returnValue(of({ success: true } as any));
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.onSave(updateDto);
      expect(catalogServiceSpy.updateValidCatalog).toHaveBeenCalledWith('CAT001', updateDto);
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should call handleSaveError when API returns success: false', () => {
      const errorResponse = { success: false, error: 'Record locked' };
      catalogServiceSpy.updateValidCatalog.and.returnValue(of(errorResponse as any));
      component.onSave(updateDto);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });

    it('should call handleSaveError on HTTP error', () => {
      catalogServiceSpy.updateValidCatalog.and.returnValue(
        throwError(() => ({ status: 404, error: { message: 'Not found' } }))
      );
      component.onSave(updateDto);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // onSaveAndCreateAnother
  // ---------------------------------------------------------------
  describe('onSaveAndCreateAnother', () => {
    const createDto: CreateValidCatalogDto = {
      catalogNumber: 'NEW2',
      manufacturerCode: 'MFR1',
      totalBagsInSet: 3,
      numberOfProds: 2,
      bagType: 'SINGLE',
      bagVolume: 500,
      weightOfBag: 10,
      collectionVolume: 450,
      anticoagulant: 'CPD',
      additiveSolution: 'AS-1',
      instSpecificCode: null,
      bagStorageRestriction: null,
      effDate: '2024-01-01',
      termDate: null,
    };

    beforeEach(() => {
      catalogServiceSpy.getFilterCatalogNumbers.and.returnValue(of([]));
      catalogServiceSpy.getManufacturers.and.returnValue(of([]));
      catalogServiceSpy.getFilterManufacturers.and.returnValue(of([]));
      catalogServiceSpy.getAnticoagulants.and.returnValue(of([]));
      catalogServiceSpy.getAdditives.and.returnValue(of([]));
    });

    it('should create catalog, show snackbar, reload, and reset form', () => {
      catalogServiceSpy.createValidCatalog.and.returnValue(of({ success: true } as any));
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      const mockDrawer = { resetForm: jasmine.createSpy('resetForm'), isSubmitting: false };
      (component as any).sideDrawerComponent = mockDrawer;

      component.onSaveAndCreateAnother(createDto);

      expect(catalogServiceSpy.createValidCatalog).toHaveBeenCalledWith(createDto);
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
      expect(mockDrawer.resetForm).toHaveBeenCalled();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should call handleSaveError when API returns success: false', () => {
      const errorResponse = { success: false, errorCode: 'ERR', error: 'Bad data' };
      catalogServiceSpy.createValidCatalog.and.returnValue(of(errorResponse as any));
      component.onSaveAndCreateAnother(createDto);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });

    it('should handle HTTP error', () => {
      catalogServiceSpy.createValidCatalog.and.returnValue(
        throwError(() => ({ status: 500, error: { message: 'fail' } }))
      );
      component.onSaveAndCreateAnother(createDto);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });

    it('should work even when sideDrawerComponent is undefined', () => {
      (component as any).sideDrawerComponent = undefined;
      catalogServiceSpy.createValidCatalog.and.returnValue(of({ success: true } as any));
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      expect(() => component.onSaveAndCreateAnother(createDto)).not.toThrow();
    });
  });

  // ---------------------------------------------------------------
  // handleSaveError (private, tested via onSave)
  // ---------------------------------------------------------------
  describe('handleSaveError paths', () => {
    const createDto: CreateValidCatalogDto = {
      catalogNumber: 'X',
      manufacturerCode: 'M',
      totalBagsInSet: 1,
      numberOfProds: 1,
      bagType: 'S',
      bagVolume: null,
      weightOfBag: null,
      collectionVolume: null,
      anticoagulant: null,
      additiveSolution: null,
      instSpecificCode: null,
      bagStorageRestriction: null,
      effDate: '2024-01-01',
      termDate: null,
    };

    beforeEach(() => {
      component.sidePanelMode = 'add';
    });

    it('should display errorResponse.error if present', () => {
      catalogServiceSpy.createValidCatalog.and.returnValue(
        throwError(() => ({
          error: { errorResponse: { error: 'Specific validation error' } },
        }))
      );
      component.onSave(createDto);
      const msg = snackbarServiceSpy.showError.calls.mostRecent().args[0];
      expect(msg).toContain('Specific validation error');
    });

    it('should display error.error.error if errorResponse not present', () => {
      catalogServiceSpy.createValidCatalog.and.returnValue(
        throwError(() => ({
          error: { error: 'Generic error text' },
        }))
      );
      component.onSave(createDto);
      const msg = snackbarServiceSpy.showError.calls.mostRecent().args[0];
      expect(msg).toContain('Generic error text');
    });

    it('should display error.error.message as fallback', () => {
      catalogServiceSpy.createValidCatalog.and.returnValue(
        throwError(() => ({
          error: { message: 'Message fallback' },
        }))
      );
      component.onSave(createDto);
      const msg = snackbarServiceSpy.showError.calls.mostRecent().args[0];
      expect(msg).toContain('Message fallback');
    });

    it('should display 404 specific message', () => {
      catalogServiceSpy.createValidCatalog.and.returnValue(
        throwError(() => ({ status: 404, error: {} }))
      );
      component.onSave(createDto);
      const msg = snackbarServiceSpy.showError.calls.mostRecent().args[0];
      expect(msg).toContain('not found');
    });

    it('should display default error when no details available', () => {
      catalogServiceSpy.createValidCatalog.and.returnValue(
        throwError(() => ({ status: 500 }))
      );
      component.onSave(createDto);
      const msg = snackbarServiceSpy.showError.calls.mostRecent().args[0];
      expect(msg).toContain('An error occurred while saving');
    });

    it('should include errorCode in display message', () => {
      catalogServiceSpy.createValidCatalog.and.returnValue(
        throwError(() => ({
          error: { errorCode: 'E123', message: 'Some error' },
        }))
      );
      component.onSave(createDto);
      const msg = snackbarServiceSpy.showError.calls.mostRecent().args[0];
      expect(msg).toContain('E123');
    });

    it('should strip leading Error: from error message', () => {
      catalogServiceSpy.createValidCatalog.and.returnValue(
        throwError(() => ({
          error: { message: 'Error: Something broke' },
        }))
      );
      component.onSave(createDto);
      const msg = snackbarServiceSpy.showError.calls.mostRecent().args[0];
      // Should not have double "Error: Error:"
      expect(msg).not.toContain('Error: Error:');
    });

    it('should reset isSubmitting on sideDrawerComponent', () => {
      const mockDrawer = { isSubmitting: true, resetForm: jasmine.createSpy() };
      (component as any).sideDrawerComponent = mockDrawer;
      catalogServiceSpy.createValidCatalog.and.returnValue(
        throwError(() => ({ error: { message: 'fail' } }))
      );
      component.onSave(createDto);
      expect(mockDrawer.isSubmitting).toBeFalse();
    });
  });

  // ---------------------------------------------------------------
  // closeFilterPanel
  // ---------------------------------------------------------------
  describe('closeFilterPanel', () => {
    it('should dispose overlay if it exists', () => {
      const mockOverlay = makeOverlayRefSpy();
      component.filterOverlayRef = mockOverlay;
      component.closeFilterPanel();
      expect(mockOverlay.dispose).toHaveBeenCalled();
      expect(component.filterOverlayRef).toBeNull();
    });

    it('should do nothing if no overlay', () => {
      component.filterOverlayRef = null;
      expect(() => component.closeFilterPanel()).not.toThrow();
    });
  });

  // ---------------------------------------------------------------
  // openFilterPanel
  // ---------------------------------------------------------------
  describe('openFilterPanel', () => {
    it('should dispose existing overlay if already open (toggle off)', () => {
      const mockOverlay = makeOverlayRefSpy();
      component.filterOverlayRef = mockOverlay;
      component.openFilterPanel();
      expect(mockOverlay.dispose).toHaveBeenCalled();
      expect(component.filterOverlayRef).toBeNull();
    });
  });

  // ---------------------------------------------------------------
  // handleKeyboardEvent
  // ---------------------------------------------------------------
  describe('handleKeyboardEvent', () => {
    let openAddSpy: jasmine.Spy;
    let openFilterSpy: jasmine.Spy;
    let closeSideSpy: jasmine.Spy;
    let closeFilterSpy: jasmine.Spy;

    beforeEach(() => {
      openAddSpy = spyOn(component, 'openAddDrawer');
      openFilterSpy = spyOn(component, 'openFilterPanel');
      closeSideSpy = spyOn(component, 'closeSideDrawer');
      closeFilterSpy = spyOn(component, 'closeFilterPanel');
    });

    it('should open add drawer on Alt+C when panel is closed', () => {
      component.sidePanelOpen = false;
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardEvent(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(openAddSpy).toHaveBeenCalled();
    });

    it('should NOT open add drawer on Alt+C when panel is already open', () => {
      component.sidePanelOpen = true;
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
      component.handleKeyboardEvent(event);
      expect(openAddSpy).not.toHaveBeenCalled();
    });

    it('should open filter panel on Alt+F when no overlay exists', () => {
      component.filterOverlayRef = null;
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'f' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardEvent(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(openFilterSpy).toHaveBeenCalled();
    });

    it('should NOT open filter panel on Alt+F when overlay already exists', () => {
      component.filterOverlayRef = makeOverlayRefSpy();
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'f' });
      component.handleKeyboardEvent(event);
      expect(openFilterSpy).not.toHaveBeenCalled();
    });

    it('should close side drawer on Escape when panel is open', () => {
      component.sidePanelOpen = true;
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.handleKeyboardEvent(event);
      expect(closeSideSpy).toHaveBeenCalled();
    });

    it('should close filter panel on Escape when filter overlay is open', () => {
      component.sidePanelOpen = false;
      component.filterOverlayRef = makeOverlayRefSpy();
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.handleKeyboardEvent(event);
      expect(closeFilterSpy).toHaveBeenCalled();
    });

    it('should prioritize closing side drawer over filter panel on Escape', () => {
      component.sidePanelOpen = true;
      component.filterOverlayRef = makeOverlayRefSpy();
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.handleKeyboardEvent(event);
      expect(closeSideSpy).toHaveBeenCalled();
      expect(closeFilterSpy).not.toHaveBeenCalled();
    });

    it('should do nothing on Escape when nothing is open', () => {
      component.sidePanelOpen = false;
      component.filterOverlayRef = null;
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.handleKeyboardEvent(event);
      expect(closeSideSpy).not.toHaveBeenCalled();
      expect(closeFilterSpy).not.toHaveBeenCalled();
    });

    it('should handle uppercase C for Alt+C', () => {
      component.sidePanelOpen = false;
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'C' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardEvent(event);
      expect(openAddSpy).toHaveBeenCalled();
    });

    it('should handle uppercase F for Alt+F', () => {
      component.filterOverlayRef = null;
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'F' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardEvent(event);
      expect(openFilterSpy).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // loadDropdowns
  // ---------------------------------------------------------------
  describe('loadDropdowns', () => {
    it('should populate catalogNumbers on success', () => {
      const data = [{ code: 'C1', description: 'Catalog 1' }];
      catalogServiceSpy.getFilterCatalogNumbers.and.returnValue(of(data));
      (component as any).loadDropdowns();
      expect(component.catalogNumbers).toEqual(data);
    });

    it('should reset catalogNumbers on error', () => {
      catalogServiceSpy.getFilterCatalogNumbers.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadDropdowns();
      expect(component.catalogNumbers).toEqual([]);
    });

    it('should populate manufacturers on success', () => {
      const data = [{ code: 'M1', description: 'Mfr 1' }];
      catalogServiceSpy.getManufacturers.and.returnValue(of(data));
      (component as any).loadDropdowns();
      expect(component.manufacturers).toEqual(data);
    });

    it('should reset manufacturers on error', () => {
      catalogServiceSpy.getManufacturers.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadDropdowns();
      expect(component.manufacturers).toEqual([]);
    });

    it('should populate filterManufacturers on success', () => {
      const data = [{ code: 'FM1', description: 'Filter Mfr 1' }];
      catalogServiceSpy.getFilterManufacturers.and.returnValue(of(data));
      (component as any).loadDropdowns();
      expect(component.filterManufacturers).toEqual(data);
    });

    it('should reset filterManufacturers on error', () => {
      catalogServiceSpy.getFilterManufacturers.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadDropdowns();
      expect(component.filterManufacturers).toEqual([]);
    });

    it('should populate anticoagulants on success', () => {
      const data = [{ code: 'A1', description: 'Anti 1' }];
      catalogServiceSpy.getAnticoagulants.and.returnValue(of(data));
      (component as any).loadDropdowns();
      expect(component.anticoagulants).toEqual(data);
    });

    it('should reset anticoagulants on error', () => {
      catalogServiceSpy.getAnticoagulants.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadDropdowns();
      expect(component.anticoagulants).toEqual([]);
    });

    it('should populate additives on success', () => {
      const data = [{ code: 'AD1', description: 'Additive 1' }];
      catalogServiceSpy.getAdditives.and.returnValue(of(data));
      (component as any).loadDropdowns();
      expect(component.additives).toEqual(data);
    });

    it('should reset additives on error', () => {
      catalogServiceSpy.getAdditives.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadDropdowns();
      expect(component.additives).toEqual([]);
    });
  });

  // ---------------------------------------------------------------
  // subscribeToChapterChanges
  // ---------------------------------------------------------------
  describe('subscribeToChapterChanges', () => {
    it('should reset state and reload on chapter change', () => {
      component.searchKeyword = 'test';
      component.appliedFilters = { catalogNumber: 'X' };
      component.filterChips = [{ key: 'x', label: 'x', value: 'x' }];
      component.sidePanelOpen = true;
      component.dataSource = [makeCatalog()];
      if (component.dataTableConfig.pagination) {
        component.dataTableConfig.pagination.pageIndex = 5;
        component.dataTableConfig.pagination.totalRecords = 100;
      }
      component.dataTableConfig.sortConfig = { column: 'manufacturer', direction: 'A' };

      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      catalogServiceSpy.getFilterCatalogNumbers.and.returnValue(of([]));
      catalogServiceSpy.getManufacturers.and.returnValue(of([]));
      catalogServiceSpy.getFilterManufacturers.and.returnValue(of([]));
      catalogServiceSpy.getAnticoagulants.and.returnValue(of([]));
      catalogServiceSpy.getAdditives.and.returnValue(of([]));

      chapterChanged$.next();

      expect(component.searchKeyword).toBe('');
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.dataSource).toEqual([]);
      expect(component.dataTableConfig.pagination?.pageIndex).toBe(0);
      expect(component.dataTableConfig.pagination?.totalRecords).toBe(0);
      expect(component.dataTableConfig.sortConfig?.column).toBe('catalogNumber');
      expect(component.dataTableConfig.sortConfig?.direction).toBe('default');
    });
  });

  // ---------------------------------------------------------------
  // ngOnDestroy
  // ---------------------------------------------------------------
  describe('ngOnDestroy', () => {
    it('should complete destroy$ and close filter panel', () => {
      spyOn(component, 'closeFilterPanel');
      component.ngOnDestroy();
      expect(component.closeFilterPanel).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // formatDateForDisplay (private, via loadData)
  // ---------------------------------------------------------------
  describe('formatDateForDisplay edge cases', () => {
    it('should return the original string for invalid dates', () => {
      const response: PaginatedResponse<ValidCatalogDto> = {
        items: [makeCatalog({ effDate: 'not-a-date', termDate: null })],
        totalRecords: 1,
      };
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(response));
      component.loadData();
      expect(component.dataSource.length).toBe(1);
    });
  });

  // ---------------------------------------------------------------
  // loadData pagination math
  // ---------------------------------------------------------------
  describe('loadData pagination calculations', () => {
    it('should compute correct take and skip', () => {
      if (component.dataTableConfig.pagination) {
        component.dataTableConfig.pagination.pageSize = 10;
        component.dataTableConfig.pagination.pageIndex = 3;
      }
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.loadData();
      const callArgs = catalogServiceSpy.getValidCatalogs.calls.mostRecent().args;
      expect(callArgs[0]).toBe(10); // take
      expect(callArgs[1]).toBe(30); // skip = 3 * 10
    });

    it('should use defaults when pagination is undefined', () => {
      component.dataTableConfig.pagination = undefined as any;
      catalogServiceSpy.getValidCatalogs.and.returnValue(of(emptyPageResponse));
      component.loadData();
      const callArgs = catalogServiceSpy.getValidCatalogs.calls.mostRecent().args;
      expect(callArgs[0]).toBe(25); // default take
      expect(callArgs[1]).toBe(0);  // default skip
    });
  });
});
