import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { signal, WritableSignal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { PathogenReductionProcessConfigurationComponent } from './pathogen-reduction-process-configuration';
import { PathogenReductionProcessConfigurationService } from './services/pathogen-reduction-process-configuration.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { Overlay } from '@angular/cdk/overlay';
import { PathogenReductionProcessConfiguration } from './models/pathogen-reduction-process-configuration.model';
import { ROUTES } from '@core/constants/route.constants';
import { createMockSnackbarService, createMockTranslateService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';
import { MenuService } from '@shared/services/menu.service';

describe('PathogenReductionProcessConfigurationComponent', () => {
  let configServiceSpy: any;
  let headerSpy: any;
  let menuServiceSpy: any;
  let component: PathogenReductionProcessConfigurationComponent;
  let fixture: ComponentFixture<PathogenReductionProcessConfigurationComponent>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;

  const mockConfiguration: PathogenReductionProcessConfiguration = {
    volumeTypeSet: 'VST001',
    volumeTypeSetDesc: 'Volume Set 001',
    suspensionType: 'Plasma',
    equipType: 'EQ001',
    minVol: 50,
    maxVol: 100,
    minPltCount: 1000,
    maxPltCount: 5000,
    minCadTime: 1,
    maxCadTime: 24,
    finalMinVolume: 40,
    finalMaxVolume: 90,
    finalMinPltCount: 800,
    finalMaxPltCount: 4500,
    finalMaxNoBags: 5,
    maxStorageDays: 7,
    effDate: '2024-01-01T00:00:00Z',
    termDate: null,
    insertDate: '2024-01-01T10:00:00Z',
    chapterId: 'WAD',
    insertUser: 'testuser',
    programId: 'PROG001'
  };

  beforeEach(() => {
    configServiceSpy = jasmine.createSpyObj('PathogenReductionProcessConfigurationService', [
      'getConfigurations'
    ]);
    configServiceSpy.getConfigurations.and.returnValue(of({ data: [mockConfiguration], totalRecords: 1 }));

    headerSpy = createMockHeaderService();

    menuServiceSpy = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);
    menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([]));
    menuServiceSpy.findMenuItemByPath.and.returnValue(null);

    const snackbarServiceSpy = createMockSnackbarService();
    const matDialogSpy = createMockMatDialog();
    const translateSpy = createMockTranslateService();

    TestBed.configureTestingModule({
      imports: [PathogenReductionProcessConfigurationComponent, NoopAnimationsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} } } },
        { provide: PathogenReductionProcessConfigurationService, useValue: configServiceSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy },
        { provide: MenuService, useValue: menuServiceSpy },
        { provide: TranslateService, useValue: translateSpy },
        { provide: Router, useValue: { navigate: jasmine.createSpy() } },
        Overlay
      ]
    }).overrideComponent(PathogenReductionProcessConfigurationComponent, {
      set: { template: '<div></div>' }
    });

    fixture = TestBed.createComponent(PathogenReductionProcessConfigurationComponent);
    component = fixture.componentInstance;
    snackbarSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should have ADD NEW action in headerConfig', () => {
      expect(component.headerConfig.actions!.length).toBe(1);
      expect(component.headerConfig.actions![0].label).toBe('ADD NEW');
    });

    it('should have Home breadcrumb', () => {
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
      expect(component.headerConfig.breadcrumbs[0].link).toBe(ROUTES.HOME);
    });

    it('should have table config with correct columns', () => {
      expect(component.tableConfig.columns.length).toBeGreaterThan(0);
      const columnKeys = component.tableConfig.columns.map(c => c.key);
      expect(columnKeys).toContain('volumeTypeSet');
      expect(columnKeys).toContain('effDate');
      expect(columnKeys).toContain('termDate');
    });

    it('should start with side panel closed', () => {
      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });

    it('should load data on init', () => {
      component.ngOnInit();
      expect(configServiceSpy.getConfigurations).toHaveBeenCalled();
    });
  });

  describe('Side Panel', () => {
    it('should open add drawer with add mode', () => {
      component.openAddDrawer();
      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should open edit drawer with edit mode and data', () => {
      component.openEditDrawer(mockConfiguration);
      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockConfiguration);
    });

    it('should close side panel and clear data', () => {
      component.openEditDrawer(mockConfiguration);
      component.closeSidePanel();
      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('Data Loading', () => {
    it('should populate dataSource on successful load', () => {
      component.loadData();
      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].volumeTypeSet).toBe('VST001');
    });

    it('should update totalRecords on successful load', () => {
      component.loadData();
      expect(component.tableConfig.pagination!.totalRecords).toBe(1);
    });

    it('should set isLoading to false after load', () => {
      component.loadData();
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Search', () => {
    it('should set searchKeyword and reload data', () => {
      component.onSearch('TEST');
      expect(component.requestState.searchKeyword).toBe('TEST');
      expect(configServiceSpy.getConfigurations).toHaveBeenCalled();
    });

    it('should reset page index when searching', () => {
      component.tableConfig.pagination!.pageIndex = 3;
      component.onSearch('TEST');
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should clear searchKeyword when search text is empty', () => {
      component.requestState.searchKeyword = 'OLD';
      component.onSearch('');
      expect(component.requestState.searchKeyword).toBeUndefined();
    });
  });

  describe('Pagination', () => {
    it('should update page index and reload', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 25 });
      expect(component.tableConfig.pagination!.pageIndex).toBe(2);
      expect(configServiceSpy.getConfigurations).toHaveBeenCalled();
    });

    it('should update page size and reload', () => {
      component.onPageChange({ pageIndex: 0, pageSize: 50 });
      expect(component.tableConfig.pagination!.pageSize).toBe(50);
    });
  });

  describe('Row Actions', () => {
    it('should open edit drawer on edit action', () => {
      component.onRowAction({ action: 'edit', row: mockConfiguration });
      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockConfiguration);
    });
  });

  describe('onSaved', () => {
    it('should reload data when saved', () => {
      configServiceSpy.getConfigurations.calls.reset();
      component.onSaved();
      expect(configServiceSpy.getConfigurations).toHaveBeenCalled();
    });

    it('should close side panel when in edit mode', () => {
      component.sidePanelMode = 'edit';
      component.sidePanelOpen = true;
      component.onSaved();
      expect(component.sidePanelOpen).toBe(false);
    });

    it('should keep side panel open when in add mode', () => {
      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;
      component.onSaved();
      expect(component.sidePanelOpen).toBe(true);
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should close side panel on Escape', () => {
      component.sidePanelOpen = true;
      component.handleKeyboardShortcut(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(component.sidePanelOpen).toBe(false);
    });

    it('should not close side panel on Escape when already closed', () => {
      component.sidePanelOpen = false;
      component.handleKeyboardShortcut(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(component.sidePanelOpen).toBe(false);
    });
  });
});
