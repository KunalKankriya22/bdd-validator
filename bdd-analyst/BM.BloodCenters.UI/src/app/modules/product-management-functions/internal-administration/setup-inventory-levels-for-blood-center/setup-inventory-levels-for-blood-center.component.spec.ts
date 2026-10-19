import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { Overlay } from '@angular/cdk/overlay';

import { SetupInventoryLevelsForBloodCenterComponent } from './setup-inventory-levels-for-blood-center.component';
import { SetupInventoryLevelsApiService } from './services/setup-inventory-levels-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import {
  SetInventoryLevelDto,
  InventoryClassLOV,
  InventoryTypeLOV,
  ProductTypeLOV,
  BloodTypeLOV,
  AttributeGroupLOV,
} from './models/setup-inventory-levels.model';
import { MatSelectChange } from '@angular/material/select';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('SetupInventoryLevelsForBloodCenterComponent', () => {
  let component: SetupInventoryLevelsForBloodCenterComponent;
  let fixture: ComponentFixture<SetupInventoryLevelsForBloodCenterComponent>;
  let serviceSpy: jasmine.SpyObj<SetupInventoryLevelsApiService>;
  let loggingSpy: jasmine.SpyObj<LoggingService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let menuServiceSpy: jasmine.SpyObj<MenuService>;
  let overlaySpy: jasmine.SpyObj<Overlay>;

  const chapterChanged$ = new Subject<void>();

  const mockInventoryClasses: InventoryClassLOV[] = [
    { code: 'IC1', codeDesc: 'Class One' },
    { code: 'IC2', codeDesc: 'Class Two' },
  ];

  const mockInventoryTypes: InventoryTypeLOV[] = [{ code: 'MI', codeDesc: 'Minimum' }];
  const mockProductTypes: ProductTypeLOV[] = [{ productType: 'PT1', productTypeDesc: 'Platelet' }];
  const mockBloodTypes: BloodTypeLOV[] = [{ aboCode: 'OP', aboDesc: 'O Positive' }];
  const mockAttributeGroups: AttributeGroupLOV[] = [{ attribGroup: 'AG1' }];

  const mockInventoryData: SetInventoryLevelDto[] = [
    {
      chapterId: 'CH1', customerId: 'C1', inventoryClass: 'IC1',
      inventoryType: 'MI', productType: 'PT1', productTypeDesc: 'Platelet',
      bloodType: 'OP', bloodTypeDesc: 'O Positive', attribGroup: null,
      attribCode: null, qty: 10, minQty: 5, optQty: 15,
      effDate: '2026-01-01', termDate: null, lastModifiedDate: null,
    },
    {
      chapterId: 'CH1', customerId: 'C1', inventoryClass: 'IC1',
      inventoryType: 'MI', productType: 'PT2', productTypeDesc: 'Red Cells',
      bloodType: 'AN', bloodTypeDesc: 'A Negative', attribGroup: null,
      attribCode: null, qty: 20, minQty: 10, optQty: 25,
      effDate: '2026-02-01', termDate: '2026-12-31', lastModifiedDate: '2026-02-01T10:00:00Z',
    },
  ];

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('SetupInventoryLevelsApiService', [
      'getInventoryLevels', 'getInventoryClasses', 'getInventoryTypes',
      'getProductTypes', 'getBloodTypes', 'getAttributeGroups',
    ]);
    loggingSpy = jasmine.createSpyObj('LoggingService', ['error', 'info', 'warn']);
    snackbarSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);
    headerServiceSpy = jasmine.createSpyObj('HeaderService', [], { chapterChanged$: chapterChanged$.asObservable() });
    menuServiceSpy = jasmine.createSpyObj('MenuService', ['findMenuItemByPath'], {
      getMenuItemsSignal: jasmine.createSpy().and.returnValue(() => []),
    });
    overlaySpy = jasmine.createSpyObj('Overlay', ['create', 'position', 'scrollStrategies']);

    serviceSpy.getInventoryClasses.and.returnValue(of(mockInventoryClasses));
    serviceSpy.getInventoryTypes.and.returnValue(of(mockInventoryTypes));
    serviceSpy.getProductTypes.and.returnValue(of(mockProductTypes));
    serviceSpy.getBloodTypes.and.returnValue(of(mockBloodTypes));
    serviceSpy.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
    serviceSpy.getInventoryLevels.and.returnValue(of({ data: mockInventoryData, total: 2 }));

    TestBed.configureTestingModule({
      imports: [SetupInventoryLevelsForBloodCenterComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SetupInventoryLevelsApiService, useValue: serviceSpy },
        { provide: LoggingService, useValue: loggingSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MenuService, useValue: menuServiceSpy },
        { provide: Overlay, useValue: overlaySpy },
      ],
    });

    fixture = TestBed.createComponent(SetupInventoryLevelsForBloodCenterComponent);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch (_) { /* template dependencies */ }
  });

  afterEach(() => {
    fixture.destroy();
  });

  // --- Loading inventory classes ---

  describe('loadInventoryClasses', () => {
    it('should populate inventory class options', () => {
      expect(component.inventoryClassOptions).toEqual(mockInventoryClasses);
      expect(component.filteredInventoryClassOptions).toEqual(mockInventoryClasses);
    });

    it('should show error snackbar on failure', () => {
      serviceSpy.getInventoryClasses.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadInventoryClasses();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load inventory classes');
    });
  });

  // --- Loading LOVs ---

  describe('loadLOVs', () => {
    it('should populate all LOV options on success', () => {
      expect(component.inventoryTypeOptions).toEqual(mockInventoryTypes);
      expect(component.productTypeOptions).toEqual(mockProductTypes);
      expect(component.bloodTypeOptions).toEqual(mockBloodTypes);
      expect(component.attributeGroupOptions).toEqual(mockAttributeGroups);
    });

    it('should log error when inventory types fail', () => {
      serviceSpy.getInventoryTypes.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadLOVs();
      expect(loggingSpy.error).toHaveBeenCalled();
    });
  });

  // --- Inventory class search filtering ---

  describe('inventory class search', () => {
    it('should filter options by code', () => {
      component.inventoryClassSearchControl.setValue('ic1');
      expect(component.filteredInventoryClassOptions.length).toBe(1);
      expect(component.filteredInventoryClassOptions[0].code).toBe('IC1');
    });

    it('should filter options by description', () => {
      component.inventoryClassSearchControl.setValue('two');
      expect(component.filteredInventoryClassOptions.length).toBe(1);
      expect(component.filteredInventoryClassOptions[0].code).toBe('IC2');
    });

    it('should show all when search is empty', () => {
      component.inventoryClassSearchControl.setValue('');
      expect(component.filteredInventoryClassOptions.length).toBe(2);
    });
  });

  // --- displayInventoryClass ---

  describe('displayInventoryClass', () => {
    it('should format object option', () => {
      expect(component.displayInventoryClass({ code: 'IC1', codeDesc: 'Class One' }))
        .toBe('IC1 - Class One');
    });

    it('should return string as-is', () => {
      expect(component.displayInventoryClass('IC1')).toBe('IC1');
    });

    it('should return empty for null', () => {
      expect(component.displayInventoryClass(null)).toBe('');
    });
  });

  // --- onInventoryClassChange ---

  describe('onInventoryClassChange', () => {
    it('should load data when class is selected', () => {
      serviceSpy.getInventoryLevels.calls.reset();
      component.onInventoryClassChange({ value: 'IC1' } as MatSelectChange);
      expect(component.selectedInventoryClass).toBe('IC1');
      expect(component.hasRetrieved).toBe(true);
      expect(serviceSpy.getInventoryLevels).toHaveBeenCalled();
    });

    it('should reset filters and search on class change', () => {
      component.appliedFilters = { inventoryLevel: 'MI' } as any;
      component.searchTerm = 'test';
      component.onInventoryClassChange({ value: 'IC2' } as MatSelectChange);
      expect(component.appliedFilters).toBeNull();
      expect(component.searchTerm).toBe('');
    });

    it('should do nothing when value is empty', () => {
      serviceSpy.getInventoryLevels.calls.reset();
      component.onInventoryClassChange({ value: '' } as MatSelectChange);
      expect(serviceSpy.getInventoryLevels).not.toHaveBeenCalled();
    });
  });

  // --- loadData ---

  describe('loadData', () => {
    it('should not call API if no inventory class selected', () => {
      serviceSpy.getInventoryLevels.calls.reset();
      component.selectedInventoryClass = null;
      (component as any).loadData();
      expect(serviceSpy.getInventoryLevels).not.toHaveBeenCalled();
    });

    it('should populate dataSource on success', () => {
      component.selectedInventoryClass = 'IC1';
      (component as any).loadData();
      expect(component.dataSource.length).toBe(2);
      expect(component.isLoading).toBe(false);
    });

    it('should set error state on API failure', () => {
      component.selectedInventoryClass = 'IC1';
      serviceSpy.getInventoryLevels.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadData();
      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(snackbarSpy.showError).toHaveBeenCalled();
    });

    it('should include sort params when direction is not default', () => {
      component.selectedInventoryClass = 'IC1';
      component.tableConfig = {
        ...component.tableConfig,
        sortConfig: { column: 'productType', direction: 'A' },
      };
      serviceSpy.getInventoryLevels.calls.reset();
      (component as any).loadData();
      const callArgs = serviceSpy.getInventoryLevels.calls.mostRecent().args;
      expect(callArgs[1].sortColumn).toBe('ProductType');
      expect(callArgs[1].sortOrder).toBe('ASC');
    });

    it('should use DESC for D direction', () => {
      component.selectedInventoryClass = 'IC1';
      component.tableConfig = {
        ...component.tableConfig,
        sortConfig: { column: 'productType', direction: 'D' },
      };
      (component as any).loadData();
      const callArgs = serviceSpy.getInventoryLevels.calls.mostRecent().args;
      expect(callArgs[1].sortOrder).toBe('DESC');
    });
  });

  // --- mapToDisplayModel ---

  describe('mapToDisplayModel', () => {
    it('should format effective date as DD-MMM-YYYY uppercase', () => {
      component.selectedInventoryClass = 'IC1';
      (component as any).loadData();
      const row = component.dataSource[0];
      expect(row.effDateDisplay).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should set termDateDisplay to null when termDate is null', () => {
      component.selectedInventoryClass = 'IC1';
      (component as any).loadData();
      expect(component.dataSource[0].termDateDisplay).toBeNull();
    });

    it('should enrich productTypeDesc from LOV when not present', () => {
      const dataNoDesc = [{ ...mockInventoryData[0], productTypeDesc: undefined, productType: 'PT1' }];
      serviceSpy.getInventoryLevels.and.returnValue(of({ data: dataNoDesc, total: 1 }));
      component.selectedInventoryClass = 'IC1';
      (component as any).loadData();
      expect(component.dataSource[0].productTypeDesc).toBe('Platelet');
    });
  });

  // --- Search ---

  describe('onSearch', () => {
    beforeEach(() => {
      component.selectedInventoryClass = 'IC1';
      (component as any).loadData();
    });

    it('should filter dataSource by search term', () => {
      component.onSearch('PT1');
      expect(component.dataSource.length).toBe(1);
    });

    it('should restore all data when search term is cleared', () => {
      component.onSearch('PT1');
      component.onSearch('');
      expect(component.dataSource.length).toBe(2);
    });

    it('should search by inventoryType', () => {
      component.onSearch('mi');
      expect(component.dataSource.length).toBe(2);
    });

    it('should reset page index on search', () => {
      component.tableConfig = { ...component.tableConfig, pagination: { ...component.tableConfig.pagination!, pageIndex: 3 } };
      component.onSearch('PT1');
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });
  });

  // --- Sort ---

  describe('onSortChange', () => {
    it('should cycle default -> A -> D -> default', () => {
      component.selectedInventoryClass = 'IC1';
      component.tableConfig = { ...component.tableConfig, sortConfig: { column: 'productType', direction: 'default' } };

      component.onSortChange({ column: 'productType', direction: 'A' } as any);
      expect(component.tableConfig.sortConfig?.direction).toBe('A');

      component.onSortChange({ column: 'productType', direction: 'D' } as any);
      expect(component.tableConfig.sortConfig?.direction).toBe('D');

      component.onSortChange({ column: 'productType', direction: 'default' } as any);
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
    });

    it('should reset page index on sort', () => {
      component.selectedInventoryClass = 'IC1';
      component.tableConfig = { ...component.tableConfig, pagination: { ...component.tableConfig.pagination!, pageIndex: 5 } };
      component.onSortChange({ column: 'productType', direction: 'A' } as any);
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });
  });

  // --- Pagination ---

  describe('onPageChange', () => {
    it('should update pagination and reload', () => {
      component.selectedInventoryClass = 'IC1';
      serviceSpy.getInventoryLevels.calls.reset();
      component.onPageChange({ pageSize: 50, pageIndex: 2 } as any);
      expect(component.tableConfig.pagination!.pageSize).toBe(50);
      expect(component.tableConfig.pagination!.pageIndex).toBe(2);
      expect(serviceSpy.getInventoryLevels).toHaveBeenCalled();
    });
  });

  // --- onClearAll ---

  describe('onClearAll', () => {
    it('should reset all state', () => {
      component.selectedInventoryClass = 'IC1';
      component.hasRetrieved = true;
      component.dataSource = component.dataSource;
      component.searchTerm = 'test';
      component.appliedFilters = { inventoryLevel: 'MI' } as any;

      component.onClearAll();

      expect(component.selectedInventoryClass).toBeNull();
      expect(component.hasRetrieved).toBe(false);
      expect(component.dataSource).toEqual([]);
      expect(component.searchTerm).toBe('');
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
    });
  });

  // --- Side panel ---

  describe('side panel operations', () => {
    it('openAddDialog should show error when no inventory class selected', () => {
      component.selectedInventoryClass = null;
      component.openAddDialog();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Please select an inventory class first');
      expect(component.sidePanelOpen).toBe(false);
    });

    it('openAddDialog should open panel in add mode when class is selected', () => {
      component.selectedInventoryClass = 'IC1';
      component.openAddDialog();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelOpen).toBe(true);
    });

    it('editRecord should open panel in edit mode with row data', () => {
      const row = { productType: 'PT1' } as any;
      component.editRecord(row);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(row);
      expect(component.sidePanelOpen).toBe(true);
    });

    it('closeSidePanel should reset panel state', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = { productType: 'PT1' } as any;
      component.closeSidePanel();
      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });
  });

  // --- onRowAction ---

  describe('onRowAction', () => {
    it('should call editRecord for edit action', () => {
      const row = { productType: 'PT1' } as any;
      spyOn(component, 'editRecord');
      component.onRowAction({ action: 'edit', row } as any);
      expect(component.editRecord).toHaveBeenCalledWith(row);
    });
  });

  // --- onSaveSuccess ---

  describe('onSaveSuccess', () => {
    it('should reload data', () => {
      component.selectedInventoryClass = 'IC1';
      serviceSpy.getInventoryLevels.calls.reset();
      component.onSaveSuccess();
      expect(serviceSpy.getInventoryLevels).toHaveBeenCalled();
    });
  });

  // --- Chapter change ---

  describe('chapterChanged$', () => {
    it('should reset all state and reload', () => {
      component.selectedInventoryClass = 'IC1';
      component.hasRetrieved = true;
      component.searchTerm = 'test';

      serviceSpy.getInventoryClasses.calls.reset();

      chapterChanged$.next();

      expect(component.selectedInventoryClass).toBeNull();
      expect(component.hasRetrieved).toBe(false);
      expect(component.dataSource).toEqual([]);
      expect(serviceSpy.getInventoryClasses).toHaveBeenCalled();
    });
  });

  // --- onInventoryClassInputChange ---

  describe('onInventoryClassInputChange', () => {
    it('should filter by string input', () => {
      component.onInventoryClassInputChange('one');
      expect(component.filteredInventoryClassOptions.length).toBe(1);
      expect(component.filteredInventoryClassOptions[0].code).toBe('IC1');
    });

    it('should not filter when object is passed', () => {
      component.onInventoryClassInputChange({ code: 'IC1', codeDesc: 'Class One' } as any);
      expect(component.filteredInventoryClassOptions.length).toBe(2);
    });
  });

  // --- inventoryClassCode getter ---

  describe('inventoryClassCode', () => {
    it('should return selected inventory class', () => {
      component.selectedInventoryClass = 'IC1';
      expect(component.inventoryClassCode).toBe('IC1');
    });

    it('should return null when none selected', () => {
      component.selectedInventoryClass = null;
      expect(component.inventoryClassCode).toBeNull();
    });
  });
});
