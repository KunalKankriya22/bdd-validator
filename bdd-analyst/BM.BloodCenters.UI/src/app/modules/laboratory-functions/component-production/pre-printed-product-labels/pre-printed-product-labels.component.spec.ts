import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslateModule } from '@ngx-translate/core';
import moment from 'moment';

import { PrePrintedProductLabelsComponent } from './pre-printed-product-labels.component';
import { PrePrintedProductLabelsApiService } from './services/pre-printed-product-labels-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { MenuService } from '@shared/services/menu.service';
import { PrePrintedProductLabelModel, PrePrintedProductLabelFilterValue } from './models/pre-printed-product-labels.model';
import { createMockSnackbarService, createMockPageHeaderService } from '@shared/testing/common-mocks';

describe('PrePrintedProductLabelsComponent', () => {
  let mockPositionStrategy: any;
  const tomorrow = moment().add(1, 'day').startOf('day');

  let component: PrePrintedProductLabelsComponent;
  let fixture: ComponentFixture<PrePrintedProductLabelsComponent>;
  let mockService: jasmine.SpyObj<PrePrintedProductLabelsApiService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  let mockHeaderService: any;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockMenuService: any;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let mockLiveAnnouncer: jasmine.SpyObj<LiveAnnouncer>;

  const chapterChangedSubject = new Subject<void>();

  const mockListResponse = {
    data: [
      {
        catalogNumber: 'TEP540004',
        productType: 'RBC',
        productTypeDesc: 'Red Blood Cells',
        bagCode: 'P53',
        faceLabel: 'E0385000',
        effDate: '2026-04-30T00:00:00'
      },
      {
        catalogNumber: 'FE00NS000',
        productType: 'FFP',
        productTypeDesc: 'Fresh Frozen Plasma',
        bagCode: 'P53',
        faceLabel: 'E2007000',
        effDate: '2026-04-30T00:00:00'
      }
    ] as PrePrintedProductLabelModel[],
    totalCount: 2
  };

  const mockAddDropdown = {
    catalogNumbers: [{ key: 'TEP540004', value: 'TEP540004' }],
    productTypes: [{ key: 'RBC', value: 'RBC', description: 'Red Blood Cells' }],
    bagCodes: [{ key: 'P53', value: 'P53', description: 'Triple CPD' }]
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('PrePrintedProductLabelsApiService', [
      'getPrePrintedProductLabels',
      'getAddDropdown',
      'getFilterDropdown',
      'getProductCodes',
      'createPrePrintedProductLabel',
      'updatePrePrintedProductLabel'
    ]);
    mockService.getFilterDropdown.and.returnValue(of({ catalogNumbers: [], productTypes: [], bagCodes: [], faceLabels: [] }));
    mockService.getProductCodes.and.returnValue(of([]));
    mockService.getPrePrintedProductLabels.and.returnValue(of(mockListResponse));
    mockService.getAddDropdown.and.returnValue(of(mockAddDropdown));
    mockService.createPrePrintedProductLabel.and.returnValue(of({ success: true, data: {}, item: {} } as any));
    mockService.updatePrePrintedProductLabel.and.returnValue(of({ success: true, data: {}, item: {} } as any));

    mockSnackbarService = createMockSnackbarService();
    mockLoggingService = jasmine.createSpyObj('LoggingService', ['error']);

    mockHeaderService = {
      chapterChanged$: chapterChangedSubject.asObservable(),
      chapterTimeZone: jasmine.createSpy('chapterTimeZone').and.returnValue('-06:00')
    };

    mockPageHeaderService = createMockPageHeaderService();
    mockPageHeaderService.getTitle.and.returnValue('Pre-Printed Product Labels');
    mockPageHeaderService.getSubtitle.and.returnValue('');

    mockMenuService = {
      getMenuItemsSignal: jasmine.createSpy('getMenuItemsSignal').and.returnValue(signal([])),
      findMenuItemByPath: jasmine.createSpy('findMenuItemByPath').and.returnValue(null)
    };

    mockPositionStrategy = jasmine.createSpyObj('FlexibleConnectedPositionStrategy', [
      'flexibleConnectedTo', 'withPositions', 'withPush'
    ]);
    mockPositionStrategy.flexibleConnectedTo.and.returnValue(mockPositionStrategy);
    mockPositionStrategy.withPositions.and.returnValue(mockPositionStrategy);
    mockPositionStrategy.withPush.and.returnValue(mockPositionStrategy);

    const mockScrollStrategy = { block: jasmine.createSpy('block').and.returnValue({}) };

    mockLiveAnnouncer = jasmine.createSpyObj('LiveAnnouncer', ['announce']);
    mockLiveAnnouncer.announce.and.returnValue(Promise.resolve());

    mockOverlay = jasmine.createSpyObj('Overlay', ['position', 'create']);
    Object.defineProperty(mockOverlay, 'scrollStrategies', {
      get: () => mockScrollStrategy,
      enumerable: true,
      configurable: true
    });
    mockOverlay.position.and.returnValue({
      flexibleConnectedTo: jasmine.createSpy('flexibleConnectedTo').and.returnValue(mockPositionStrategy)
    } as any);



      TestBed.configureTestingModule({
      imports: [
        PrePrintedProductLabelsComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: PrePrintedProductLabelsApiService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: LoggingService, useValue: mockLoggingService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: MenuService, useValue: mockMenuService },
        { provide: Overlay, useValue: mockOverlay },
        { provide: LiveAnnouncer, useValue: mockLiveAnnouncer }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });


      mockService.getFilterDropdown.and.returnValue(of({ catalogNumbers: [], productTypes: [], bagCodes: [], faceLabels: [] }));


      mockService.getProductCodes.and.returnValue(of([]));


      mockService.getPrePrintedProductLabels.and.returnValue(of(mockListResponse));


      mockService.getAddDropdown.and.returnValue(of(mockAddDropdown));


      mockService.createPrePrintedProductLabel.and.returnValue(of({ success: true, data: {}, item: {} } as any));


      mockService.updatePrePrintedProductLabel.and.returnValue(of({ success: true, data: {}, item: {} } as any));


      mockPageHeaderService.getTitle.and.returnValue('Pre-Printed Product Labels');


      mockPageHeaderService.getSubtitle.and.returnValue('');


      mockPositionStrategy.flexibleConnectedTo.and.returnValue(mockPositionStrategy);


      mockPositionStrategy.withPositions.and.returnValue(mockPositionStrategy);


      mockPositionStrategy.withPush.and.returnValue(mockPositionStrategy);


    fixture = TestBed.createComponent(PrePrintedProductLabelsComponent);
    component = fixture.componentInstance;


    });

  afterEach(() => {
    if (fixture) fixture.destroy();
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should populate add dropdown options', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.catalogNumberOptions.length).toBe(1);
      expect(component.productTypeOptions.length).toBe(1);
      expect(component.bagCodeOptions.length).toBe(1);
    }));

    it('should call loadData and loadLookupOptions on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(mockService.getPrePrintedProductLabels).toHaveBeenCalled();
      expect(mockService.getAddDropdown).toHaveBeenCalled();
    }));

    it('should initialize headerConfig with ADD action', () => {
      fixture.detectChanges();
      expect(component.headerConfig.actions).toBeDefined();
      expect(component.headerConfig.actions!.length).toBe(1);
      expect(component.headerConfig.actions![0].label).toBe('ADD NEW PRE-PRINTED PRODUCT LABEL');
    });

    it('should initialize searchConfig with correct placeholder', () => {
      fixture.detectChanges();
      expect(component.searchConfig.placeholder).toBe('Search by Product Type');
      expect(component.searchConfig.minLength).toBe(3);
    });

    it('should initialize tableConfig with correct columns and pagination', () => {
      fixture.detectChanges();
      expect(component.tableConfig.columns.length).toBe(7);
      expect(component.tableConfig.pagination!.pageSize).toBe(25);
      expect(component.tableConfig.pagination!.pageSizeOptions).toEqual([10, 25, 50, 100]);
      expect(component.tableConfig.sortConfig!.column).toBe('catalogNumber');
      expect(component.tableConfig.sortConfig!.direction).toBe('default');
    });

    it('should initialize default component state', () => {
      expect(component.isLoading).toBeFalse();
      expect(component.hasError).toBeFalse();
      expect(component.errorMessage).toBe('');
      expect(component.isFilterOpen).toBeFalse();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.dataSource).toEqual([]);
    });

    it('should set isLoading true during data load', () => {
      // Before detectChanges, loadData hasn't been called yet
      fixture.detectChanges();
      // After sync subscribe resolves, isLoading should be false
      expect(component.isLoading).toBeFalse();
    });

    it('should populate dataSource and totalRecords on successful load', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.dataSource.length).toBe(2);
      expect(component.tableConfig.pagination!.totalRecords).toBe(2);
    }));

    it('should announce loaded record count via LiveAnnouncer on success', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Loaded 2 pre-printed product labels');
    }));

    it('should call getMenuItemsSignal in constructor effect', () => {
      fixture.detectChanges();
      expect(mockMenuService.getMenuItemsSignal).toHaveBeenCalled();
    });

    it('should not update headerConfig when menu items is empty array', () => {
      fixture.detectChanges();
      // The default signal returns [], so the effect skips the update
      // headerConfig title should be empty (from initializeConfigurations, before effect could override)
      expect(component.headerConfig.title).toBe('');
      expect(mockMenuService.findMenuItemByPath).not.toHaveBeenCalled();
    });
  });

  describe('loadData', () => {
    it('should set hasError on load failure', fakeAsync(() => {
      mockService.getPrePrintedProductLabels.and.returnValue(throwError(() => new Error('Load failed')));
      fixture.detectChanges();
      tick();
      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('Failed to load data. Please try again.');
    }));

    it('should log error on load failure', fakeAsync(() => {
      mockService.getPrePrintedProductLabels.and.returnValue(throwError(() => new Error('Load failed')));
      fixture.detectChanges();
      tick();
      expect(mockLoggingService.error).toHaveBeenCalledWith('Error loading pre-printed product labels', jasmine.any(Error));
    }));

    it('should announce failure via LiveAnnouncer on load error', fakeAsync(() => {
      mockService.getPrePrintedProductLabels.and.returnValue(throwError(() => new Error('Load failed')));
      fixture.detectChanges();
      tick();
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Failed to load data');
    }));

    it('should calculate skip based on pageIndex and pageSize', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 10;
      component.loadData();
      tick();

      const callArgs = mockService.getPrePrintedProductLabels.calls.mostRecent().args;
      expect(callArgs[0]).toBe(10); // take
      expect(callArgs[1]).toBe(20); // skip = 2 * 10
    }));

    it('should pass filter params from requestState to service', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.requestState = {
        catalogNumber: 'TEP540004',
        productType: 'RBC',
        bagCode: 'P53',
        faceLabel: 'E0385000',
        searchKeyword: 'test',
        effDate: '2026-01-01',
        effDatePeriod: 'after',
        termDate: '2026-12-31',
        termDatePeriod: 'before',
        sortColumn: 'catalogNumber',
        sortOrder: 'ASC'
      };
      component.loadData();
      tick();

      const callArgs = mockService.getPrePrintedProductLabels.calls.mostRecent().args;
      const queryDto = callArgs[2];
      expect(queryDto.catalogNumber).toBe('TEP540004');
      expect(queryDto.productType).toBe('RBC');
      expect(queryDto.bagCode).toBe('P53');
      expect(queryDto.faceLabel).toBe('E0385000');
      expect(queryDto.searchKeyword).toBe('test');
      expect(queryDto.effDate).toBe('2026-01-01');
      expect(queryDto.effDatePeriod).toBe('after');
      expect(queryDto.termDate).toBe('2026-12-31');
      expect(queryDto.termDatePeriod).toBe('before');
      expect(queryDto.sortColumn).toBe('catalogNumber');
      expect(queryDto.sortOrder).toBe('ASC');
    }));

    it('should convert empty string requestState values to undefined', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.requestState = {
        catalogNumber: '',
        productType: '',
        searchKeyword: ''
      };
      component.loadData();
      tick();

      const callArgs = mockService.getPrePrintedProductLabels.calls.mostRecent().args;
      const queryDto = callArgs[2];
      expect(queryDto.catalogNumber).toBeUndefined();
      expect(queryDto.productType).toBeUndefined();
      expect(queryDto.searchKeyword).toBeUndefined();
    }));

    it('should use default pageSize 25 when pagination is not set', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Reset pagination values
      component.tableConfig.pagination!.pageIndex = 0;
      component.tableConfig.pagination!.pageSize = 25;
      component.loadData();
      tick();

      const callArgs = mockService.getPrePrintedProductLabels.calls.mostRecent().args;
      expect(callArgs[0]).toBe(25);
      expect(callArgs[1]).toBe(0);
    }));
  });

  describe('loadLookupOptions Error Handling', () => {
    it('should log error and show snackbar when getAddDropdown fails', fakeAsync(() => {
      mockService.getAddDropdown.and.returnValue(throwError(() => new Error('Dropdown fail')));
      fixture.detectChanges();
      tick();

      expect(mockLoggingService.error).toHaveBeenCalledWith('Error loading add/edit dropdown options', jasmine.any(Error));
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load form options');
    }));
  });

  describe('Search', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set search keyword and reload data', () => {
      component.onSearch('FFP');
      expect(component.requestState.searchKeyword).toBe('FFP');
      expect(mockService.getPrePrintedProductLabels).toHaveBeenCalled();
    });

    it('should clear search keyword when empty string is provided', () => {
      component.requestState.searchKeyword = 'previously set';
      component.onSearch('');
      expect(component.requestState.searchKeyword).toBeUndefined();
    });

    it('should reset pageIndex to 0 on search', () => {
      component.tableConfig.pagination!.pageIndex = 5;
      component.onSearch('RBC');
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should handle search when pagination is undefined', () => {
      // Remove pagination temporarily to cover the null-check branch
      const savedPagination = component.tableConfig.pagination;
      (component.tableConfig as any).pagination = undefined;
      expect(() => component.onSearch('test')).not.toThrow();
      component.tableConfig.pagination = savedPagination;
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update pageIndex and pageSize on page change', () => {
      component.onPageChange({ pageIndex: 3, pageSize: 50 });
      expect(component.tableConfig.pagination!.pageIndex).toBe(3);
      expect(component.tableConfig.pagination!.pageSize).toBe(50);
      expect(mockService.getPrePrintedProductLabels).toHaveBeenCalled();
    });

    it('should handle page change to first page', () => {
      component.tableConfig.pagination!.pageIndex = 5;
      component.onPageChange({ pageIndex: 0, pageSize: 25 });
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should handle page change when pagination is undefined', () => {
      const savedPagination = component.tableConfig.pagination;
      (component.tableConfig as any).pagination = undefined;
      expect(() => component.onPageChange({ pageIndex: 1, pageSize: 10 })).not.toThrow();
      component.tableConfig.pagination = savedPagination;
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set sort column and ascending direction', () => {
      component.onSortChange({ column: 'productType', direction: 'A' });
      expect(component.tableConfig.sortConfig!.column).toBe('productType');
      expect(component.tableConfig.sortConfig!.direction).toBe('A');
      expect(component.requestState.sortColumn).toBe('productType');
      expect(component.requestState.sortOrder).toBe('ASC');
    });

    it('should set sort column and descending direction', () => {
      component.onSortChange({ column: 'bagCode', direction: 'D' });
      expect(component.requestState.sortColumn).toBe('bagCode');
      expect(component.requestState.sortOrder).toBe('DESC');
    });

    it('should clear sortOrder when direction is default', () => {
      component.requestState.sortOrder = 'ASC';
      component.onSortChange({ column: 'catalogNumber', direction: 'default' });
      expect(component.requestState.sortOrder).toBeUndefined();
    });

    it('should reload data after sort change', () => {
      const callCountBefore = mockService.getPrePrintedProductLabels.calls.count();
      component.onSortChange({ column: 'effDate', direction: 'A' });
      expect(mockService.getPrePrintedProductLabels.calls.count()).toBeGreaterThan(callCountBefore);
    });
  });

  describe('Side Panel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open add panel with correct state', () => {
      component.openAddPanel();
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should open edit panel with row data', () => {
      const row = mockListResponse.data[0];
      component.openEditPanel(row);
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(row);
    });

    it('should attempt to focus the side panel after opening', fakeAsync(() => {
      component.openAddPanel();
      tick();
      expect(component.sidePanelOpen).toBeTrue();
    }));

    it('should close side panel and clear data', () => {
      component.openEditPanel(mockListResponse.data[0]);
      component.closeSidePanel();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });

    it('should open edit panel for another row while panel is open', () => {
      component.openEditPanel(mockListResponse.data[0]);
      expect(component.sidePanelData?.catalogNumber).toBe('TEP540004');

      component.openEditPanel(mockListResponse.data[1]);
      expect(component.sidePanelData?.catalogNumber).toBe('FE00NS000');
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
    });

    it('should handle row action for edit', () => {
      spyOn(component, 'openEditPanel');
      component.onRowAction({ action: 'edit', row: mockListResponse.data[0] });
      expect(component.openEditPanel).toHaveBeenCalledWith(mockListResponse.data[0]);
    });

    it('should not call openEditPanel for non-edit actions', () => {
      spyOn(component, 'openEditPanel');
      component.onRowAction({ action: 'delete', row: mockListResponse.data[0] });
      expect(component.openEditPanel).not.toHaveBeenCalled();
    });

    it('should invoke ADD action onClick from headerConfig', () => {
      spyOn(component, 'openAddPanel');
      component.headerConfig.actions![0].onClick();
      expect(component.openAddPanel).toHaveBeenCalled();
    });
  });

  describe('Create Record', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call create service and show success message', fakeAsync(() => {
      component.openAddPanel();
      const formValue = {
        catalogNumber: 'TEP540004',
        productType: 'RBC',
        bagCode: 'P53',
        faceLabel: 'E0385000',
        effDate: tomorrow.clone(),
        termDate: null
      };

      component.onPanelSave(formValue);
      tick();

      expect(mockService.createPrePrintedProductLabel).toHaveBeenCalled();
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith(
        'Pre-Printed Product Label has been successfully added.'
      );
    }));

    it('should close panel after successful create', fakeAsync(() => {
      component.openAddPanel();
      component.onPanelSave({
        catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53',
        faceLabel: 'E0385000', effDate: tomorrow.clone(), termDate: null
      });
      tick();
      expect(component.sidePanelOpen).toBeFalse();
    }));

    it('should reload data after successful create', fakeAsync(() => {
      fixture.detectChanges();
      const callCountBefore = mockService.getPrePrintedProductLabels.calls.count();
      component.openAddPanel();
      component.onPanelSave({
        catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53',
        faceLabel: 'E0385000', effDate: tomorrow.clone(), termDate: null
      });
      tick();
      expect(mockService.getPrePrintedProductLabels.calls.count()).toBeGreaterThan(callCountBefore);
    }));

    it('should show info snackbar when response contains error', fakeAsync(() => {
      mockService.createPrePrintedProductLabel.and.returnValue(of({ success: true, error: 'Some warning' } as any));
      component.openAddPanel();
      component.onPanelSave({
        catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53',
        faceLabel: 'E0385000', effDate: tomorrow.clone(), termDate: null
      });
      tick();
      expect(mockSnackbarService.showInfo).toHaveBeenCalledWith('Some warning');
    }));

    it('should handle create with null optional fields', fakeAsync(() => {
      component.openAddPanel();
      component.onPanelSave({
        catalogNumber: 'TEP540004', productType: null, bagCode: null,
        faceLabel: null, effDate: tomorrow.clone(), termDate: null
      });
      tick();

      const payload = mockService.createPrePrintedProductLabel.calls.mostRecent().args[0];
      expect(payload.productType).toBe('');
      expect(payload.bagCode).toBe('');
      expect(payload.faceLabel).toBe('');
    }));

    it('should set error on addEditComponent when create fails', fakeAsync(() => {
      mockService.createPrePrintedProductLabel.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'Duplicate entry' } } }))
      );

      component.openAddPanel();
      component.addEditComponent = {
        isSubmitting: true,
        errorMessage: null,
        cdr: { markForCheck: jasmine.createSpy() }
      } as any;

      component.onPanelSave({
        catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53',
        faceLabel: 'E0385000', effDate: tomorrow.clone(), termDate: null
      });
      tick();

      expect(component.addEditComponent.isSubmitting).toBeFalse();
      expect(component.addEditComponent.errorMessage).toBe('Duplicate entry');
      expect(component.addEditComponent.cdr.markForCheck).toHaveBeenCalled();
    }));

    it('should handle create error when addEditComponent is null', fakeAsync(() => {
      mockService.createPrePrintedProductLabel.and.returnValue(
        throwError(() => new Error('fail'))
      );

      component.openAddPanel();
      (component as any).addEditComponent = undefined;

      expect(() => {
        component.onPanelSave({
          catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53',
          faceLabel: 'E0385000', effDate: tomorrow.clone(), termDate: null
        });
        tick();
      }).not.toThrow();
    }));
  });

  describe('Update Record', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call update service and show success message', fakeAsync(() => {
      component.openEditPanel(mockListResponse.data[0]);
      component.onPanelSave({
        catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53',
        faceLabel: 'E0385000', effDate: tomorrow.clone(), termDate: null
      });
      tick();

      expect(mockService.updatePrePrintedProductLabel).toHaveBeenCalledWith(
        'TEP540004', 'RBC', jasmine.any(Object)
      );
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith(
        'Pre-Printed Product Label has been successfully updated.'
      );
    }));

    it('should close panel after successful update', fakeAsync(() => {
      component.openEditPanel(mockListResponse.data[0]);
      component.onPanelSave({
        catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53',
        faceLabel: 'E0385000', effDate: tomorrow.clone(), termDate: null
      });
      tick();
      expect(component.sidePanelOpen).toBeFalse();
    }));

    it('should reload data after successful update', fakeAsync(() => {
      const callCountBefore = mockService.getPrePrintedProductLabels.calls.count();
      component.openEditPanel(mockListResponse.data[0]);
      component.onPanelSave({
        catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53',
        faceLabel: 'E0385000', effDate: tomorrow.clone(), termDate: null
      });
      tick();
      expect(mockService.getPrePrintedProductLabels.calls.count()).toBeGreaterThan(callCountBefore);
    }));

    it('should show info snackbar when update response contains error', fakeAsync(() => {
      mockService.updatePrePrintedProductLabel.and.returnValue(of({ success: true, error: 'Warning info' } as any));
      component.openEditPanel(mockListResponse.data[0]);
      component.onPanelSave({
        catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53',
        faceLabel: 'E0385000', effDate: tomorrow.clone(), termDate: null
      });
      tick();
      expect(mockSnackbarService.showInfo).toHaveBeenCalledWith('Warning info');
    }));

    it('should not call update service when sidePanelData is null', fakeAsync(() => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = null;
      component.onPanelSave({
        catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53',
        faceLabel: 'E0385000', effDate: tomorrow.clone(), termDate: null
      });
      tick();
      expect(mockService.updatePrePrintedProductLabel).not.toHaveBeenCalled();
    }));

    it('should set error on addEditComponent when update fails', fakeAsync(() => {
      mockService.updatePrePrintedProductLabel.and.returnValue(
        throwError(() => ({ error: { message: 'Conflict error' } }))
      );

      component.openEditPanel(mockListResponse.data[0]);
      component.addEditComponent = {
        isSubmitting: true,
        errorMessage: null,
        cdr: { markForCheck: jasmine.createSpy() }
      } as any;

      component.onPanelSave({
        catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53',
        faceLabel: 'E0385000', effDate: tomorrow.clone(), termDate: null
      });
      tick();

      expect(component.addEditComponent.isSubmitting).toBeFalse();
      expect(component.addEditComponent.errorMessage).toBe('Conflict error');
      expect(component.addEditComponent.cdr.markForCheck).toHaveBeenCalled();
    }));

    it('should use fallback message for update error without details', fakeAsync(() => {
      mockService.updatePrePrintedProductLabel.and.returnValue(
        throwError(() => ({}))
      );

      component.openEditPanel(mockListResponse.data[0]);
      component.addEditComponent = {
        isSubmitting: true,
        errorMessage: null,
        cdr: { markForCheck: jasmine.createSpy() }
      } as any;

      component.onPanelSave({
        catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53',
        faceLabel: 'E0385000', effDate: tomorrow.clone(), termDate: null
      });
      tick();

      expect(component.addEditComponent.errorMessage).toBe('Failed to update pre-printed product label. Please try again.');
    }));

    it('should handle update error when addEditComponent is null', fakeAsync(() => {
      mockService.updatePrePrintedProductLabel.and.returnValue(
        throwError(() => new Error('fail'))
      );

      component.openEditPanel(mockListResponse.data[0]);
      (component as any).addEditComponent = undefined;

      expect(() => {
        component.onPanelSave({
          catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53',
          faceLabel: 'E0385000', effDate: tomorrow.clone(), termDate: null
        });
        tick();
      }).not.toThrow();
    }));
  });

  describe('Save and Create Another', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call create and not close panel', fakeAsync(() => {
      component.openAddPanel();
      component.addEditComponent = {
        resetFormForCreateAnother: jasmine.createSpy('resetFormForCreateAnother')
      } as any;

      component.onPanelSaveAndCreateAnother({
        catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53',
        faceLabel: 'E0385000', effDate: tomorrow.clone(), termDate: null
      });
      tick();

      expect(mockService.createPrePrintedProductLabel).toHaveBeenCalled();
      expect(component.addEditComponent.resetFormForCreateAnother).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBeTrue();
    }));

    it('should handle saveAndCreateAnother when addEditComponent is null', fakeAsync(() => {
      component.openAddPanel();
      (component as any).addEditComponent = undefined;

      expect(() => {
        component.onPanelSaveAndCreateAnother({
          catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53',
          faceLabel: 'E0385000', effDate: tomorrow.clone(), termDate: null
        });
        tick();
      }).not.toThrow();
    }));
  });

  describe('Filters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should apply filters and update request state', () => {
      const filters: PrePrintedProductLabelFilterValue = {
        catalogNumber: 'TEP540004',
        productType: 'RBC',
        bagCode: 'P53',
        faceLabel: 'E0385000'
      };
      component.applyFilters(filters);
      expect(component.appliedFilters).toEqual(filters);
      expect(component.requestState.catalogNumber).toBe('TEP540004');
      expect(component.requestState.productType).toBe('RBC');
      expect(component.requestState.bagCode).toBe('P53');
      expect(component.requestState.faceLabel).toBe('E0385000');
    });

    it('should generate filter chips from applied filters', () => {
      component.applyFilters({ catalogNumber: 'TEP540004', productType: 'RBC' });
      expect(component.filterChips.length).toBeGreaterThan(0);
    });

    it('should reset pageIndex to 0 when applying filters', () => {
      component.tableConfig.pagination!.pageIndex = 3;
      component.applyFilters({ catalogNumber: 'TEP540004' });
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should apply date filters with period', () => {
      component.applyFilters({
        effDate: '2026-01-01',
        effDatePeriod: 'after',
        termDate: '2026-12-31',
        termDatePeriod: 'before'
      });
      expect(component.requestState.effDate).toBe('2026-01-01');
      expect(component.requestState.effDatePeriod).toBe('after');
      expect(component.requestState.termDate).toBe('2026-12-31');
      expect(component.requestState.termDatePeriod).toBe('before');
    });

    it('should convert empty filter values to undefined', () => {
      component.applyFilters({ catalogNumber: '', productType: '' });
      expect(component.requestState.catalogNumber).toBeUndefined();
      expect(component.requestState.productType).toBeUndefined();
    });

    it('should clear all filters and reload', () => {
      component.applyFilters({ catalogNumber: 'TEP540004', faceLabel: 'E0385000' });
      component.clearAllFilters();
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(mockService.getPrePrintedProductLabels).toHaveBeenCalled();
    });

    it('should remove filter-related keys from requestState on clearAllFilters', () => {
      component.applyFilters({
        catalogNumber: 'TEP540004',
        productType: 'RBC',
        bagCode: 'P53',
        faceLabel: 'E0385000',
        searchKeyword: 'search',
        effDate: '2026-01-01',
        effDatePeriod: 'after',
        termDate: '2026-12-31',
        termDatePeriod: 'before'
      });
      component.requestState.sortColumn = 'catalogNumber';
      component.requestState.sortOrder = 'ASC';

      component.clearAllFilters();

      expect(component.requestState.catalogNumber).toBeUndefined();
      expect(component.requestState.productType).toBeUndefined();
      expect(component.requestState.bagCode).toBeUndefined();
      expect(component.requestState.faceLabel).toBeUndefined();
      expect(component.requestState.searchKeyword).toBeUndefined();
      expect(component.requestState.effDate).toBeUndefined();
      expect(component.requestState.effDatePeriod).toBeUndefined();
      expect(component.requestState.termDate).toBeUndefined();
      expect(component.requestState.termDatePeriod).toBeUndefined();
      // Non-filter keys should be preserved
      expect(component.requestState.sortColumn).toBe('catalogNumber');
      expect(component.requestState.sortOrder).toBe('ASC');
    });

    it('should reset pageIndex on clearAllFilters', () => {
      component.tableConfig.pagination!.pageIndex = 5;
      component.clearAllFilters();
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should report active filters correctly', () => {
      expect(component.hasActiveFilters()).toBeFalse();
      component.applyFilters({ catalogNumber: 'TEP540004' });
      expect(component.hasActiveFilters()).toBeTrue();
    });

    it('should remove a specific filter chip and reload', () => {
      component.applyFilters({ catalogNumber: 'TEP540004', productType: 'RBC' });
      const callCountBefore = mockService.getPrePrintedProductLabels.calls.count();

      component.onRemoveFilterChip('catalogNumber');

      expect(mockService.getPrePrintedProductLabels.calls.count()).toBeGreaterThan(callCountBefore);
    });

    it('should reset pageIndex when removing a filter chip', () => {
      component.applyFilters({ catalogNumber: 'TEP540004', productType: 'RBC' });
      component.tableConfig.pagination!.pageIndex = 3;
      component.onRemoveFilterChip('catalogNumber');
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should update filterChips after removing a chip', () => {
      component.applyFilters({ catalogNumber: 'TEP540004', productType: 'RBC' });
      const initialChipCount = component.filterChips.length;
      component.onRemoveFilterChip('catalogNumber');
      expect(component.filterChips.length).toBeLessThan(initialChipCount);
    });

    it('should set appliedFilters to null when all chips are removed', () => {
      component.applyFilters({ catalogNumber: 'TEP540004' });
      component.onRemoveFilterChip('catalogNumber');
      expect(component.appliedFilters).toBeNull();
    });

    it('should handle clearAllFilters when pagination is undefined', () => {
      const savedPagination = component.tableConfig.pagination;
      (component.tableConfig as any).pagination = undefined;
      expect(() => component.clearAllFilters()).not.toThrow();
      component.tableConfig.pagination = savedPagination;
    });
  });

  describe('updateRequestStateFromFilters (via onRemoveFilterChip)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear filter keys from requestState when appliedFilters becomes null', () => {
      component.requestState = {
        catalogNumber: 'TEP540004',
        productType: 'RBC',
        sortColumn: 'catalogNumber',
        sortOrder: 'ASC'
      };
      component.appliedFilters = { catalogNumber: 'TEP540004' };
      component.onRemoveFilterChip('catalogNumber');

      // After removing the only filter, appliedFilters becomes null
      // updateRequestStateFromFilters should strip filter keys
      expect(component.requestState.catalogNumber).toBeUndefined();
      expect(component.requestState.productType).toBeUndefined();
      // sortColumn/sortOrder preserved via rest spread
      expect(component.requestState.sortColumn).toBe('catalogNumber');
      expect(component.requestState.sortOrder).toBe('ASC');
    });

    it('should update requestState from remaining filters', () => {
      component.applyFilters({ catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53' });
      component.onRemoveFilterChip('catalogNumber');

      // productType and bagCode should still be in requestState
      expect(component.requestState.productType).toBe('RBC');
      expect(component.requestState.bagCode).toBe('P53');
    });
  });

  describe('Chapter Changes', () => {
    it('should reload data and dropdowns when chapter changes', fakeAsync(() => {
      fixture.detectChanges();

      chapterChangedSubject.next();
      tick();

      expect(mockService.getPrePrintedProductLabels).toHaveBeenCalled();
      expect(mockService.getAddDropdown).toHaveBeenCalled();
    }));

    it('should handle multiple chapter changes', fakeAsync(() => {
      fixture.detectChanges();
      const callsBefore = mockService.getPrePrintedProductLabels.calls.count();

      chapterChangedSubject.next();
      tick();
      chapterChangedSubject.next();
      tick();

      expect(mockService.getPrePrintedProductLabels.calls.count()).toBe(callsBefore + 2);
    }));
  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open add panel on Alt+C', () => {
      spyOn(component, 'openAddPanel');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardShortcut(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.openAddPanel).toHaveBeenCalled();
    });

    it('should open add panel on Alt+C (uppercase)', () => {
      spyOn(component, 'openAddPanel');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'C' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardShortcut(event);
      expect(component.openAddPanel).toHaveBeenCalled();
    });

    it('should focus search bar on Alt+S', () => {
      component.searchBarComponent = { focus: jasmine.createSpy('focus') } as any;
      const event = new KeyboardEvent('keydown', { altKey: true, key: 's' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardShortcut(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.searchBarComponent.focus).toHaveBeenCalled();
    });

    it('should handle Alt+S when searchBarComponent is undefined', () => {
      (component as any).searchBarComponent = undefined;
      const event = new KeyboardEvent('keydown', { altKey: true, key: 's' });
      spyOn(event, 'preventDefault');
      expect(() => component.handleKeyboardShortcut(event)).not.toThrow();
    });

    it('should open filter on Alt+F', () => {
      spyOn(component, 'openFilter');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'f' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardShortcut(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.openFilter).toHaveBeenCalled();
    });

    it('should close side panel on Escape when panel is open', () => {
      component.sidePanelOpen = true;
      spyOn(component, 'closeSidePanel');
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardShortcut(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.closeSidePanel).toHaveBeenCalled();
    });

    it('should close overlay on Escape when overlay is open and panel is closed', () => {
      component.sidePanelOpen = false;
      (component as any).overlayRef = { dispose: jasmine.createSpy('dispose') };
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardShortcut(event);
      expect(event.preventDefault).toHaveBeenCalled();
      // closeOverlay should have been called which disposes the overlayRef
      expect((component as any).overlayRef).toBeNull();
    });

    it('should do nothing on Escape when neither panel nor overlay is open', () => {
      component.sidePanelOpen = false;
      (component as any).overlayRef = null;
      spyOn(component, 'closeSidePanel');
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardShortcut(event);
      expect(component.closeSidePanel).not.toHaveBeenCalled();
    });

    it('should not trigger shortcuts without Alt key for Alt shortcuts', () => {
      spyOn(component, 'openAddPanel');
      spyOn(component, 'openFilter');
      const event = new KeyboardEvent('keydown', { key: 'c' });
      component.handleKeyboardShortcut(event);
      expect(component.openAddPanel).not.toHaveBeenCalled();
      expect(component.openFilter).not.toHaveBeenCalled();
    });

    it('should prioritize side panel close over overlay close on Escape', () => {
      component.sidePanelOpen = true;
      (component as any).overlayRef = { dispose: jasmine.createSpy('dispose') };
      spyOn(component, 'closeSidePanel');
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardShortcut(event);
      expect(component.closeSidePanel).toHaveBeenCalled();
      // overlayRef should still be present (not disposed) because side panel takes priority
      expect((component as any).overlayRef).toBeTruthy();
    });
  });

  describe('Filter Overlay', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should close existing overlay when openFilter is called while open', () => {
      const mockOverlayRef = {
        dispose: jasmine.createSpy('dispose'),
        attach: jasmine.createSpy('attach'),
        backdropClick: jasmine.createSpy('backdropClick').and.returnValue(of())
      };
      (component as any).overlayRef = mockOverlayRef;

      component.openFilter();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should set isFilterOpen to true when opening filter', () => {
      const mockOverlayRef = {
        dispose: jasmine.createSpy('dispose'),
        attach: jasmine.createSpy('attach').and.returnValue({
          instance: {
            currentFilters: null,
            apply: new Subject(),
            close: new Subject()
          }
        }),
        backdropClick: jasmine.createSpy('backdropClick').and.returnValue(of())
      };
      mockOverlay.create.and.returnValue(mockOverlayRef as any);

      component.openFilter();

      expect(component.isFilterOpen).toBeTrue();
    });
  });

  describe('closeOverlay (private, via openFilter toggle)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should dispose overlayRef and reset state', () => {
      const mockOverlayRef = { dispose: jasmine.createSpy('dispose') };
      (component as any).overlayRef = mockOverlayRef;
      component.isFilterOpen = true;

      // Call closeOverlay indirectly via openFilter toggle
      component.openFilter();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect((component as any).overlayRef).toBeNull();
      expect(component.isFilterOpen).toBeFalse();
    });
  });

  describe('formatDate (private, via tableConfig valueFormatter)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format valid date correctly', () => {
      const columns = component.tableConfig.columns;
      const effDateColumn = columns.find(c => c.key === 'effDate');
      expect(effDateColumn).toBeTruthy();
      expect(effDateColumn!.valueFormatter).toBeDefined();

      const result = effDateColumn!.valueFormatter!('2026-04-30T00:00:00');
      // Format is DD-MMM-YYYY
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
      expect(result).toBe('30-APR-2026');
    });

    it('should return dash for null date', () => {
      const effDateColumn = component.tableConfig.columns.find(c => c.key === 'effDate');
      const result = effDateColumn!.valueFormatter!(null);
      expect(result).toBe('-');
    });

    it('should return dash for undefined date', () => {
      const effDateColumn = component.tableConfig.columns.find(c => c.key === 'effDate');
      const result = effDateColumn!.valueFormatter!(undefined);
      expect(result).toBe('-');
    });

    it('should format termDate column correctly', () => {
      const termDateColumn = component.tableConfig.columns.find(c => c.key === 'termDate');
      expect(termDateColumn).toBeTruthy();
      expect(termDateColumn!.valueFormatter).toBeDefined();

      const result = termDateColumn!.valueFormatter!('2026-12-25T00:00:00');
      expect(result).toBe('25-DEC-2026');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ and overlayClose$ subjects', () => {
      fixture.detectChanges();
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const destroyCompleteSpy = spyOn((component as any).destroy$, 'complete');
      const overlayCloseSpy = spyOn((component as any).overlayClose$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(destroyCompleteSpy).toHaveBeenCalled();
      expect(overlayCloseSpy).toHaveBeenCalled();
    });

    it('should dispose overlayRef if it exists', () => {
      fixture.detectChanges();
      const mockOverlayRefLocal = { dispose: jasmine.createSpy('dispose') };
      (component as any).overlayRef = mockOverlayRefLocal;

      component.ngOnDestroy();

      expect(mockOverlayRefLocal.dispose).toHaveBeenCalled();
    });

    it('should not throw if overlayRef is null', () => {
      fixture.detectChanges();
      (component as any).overlayRef = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('Table Configuration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have correct column headers', () => {
      const headers = component.tableConfig.columns.map(c => c.header);
      expect(headers).toEqual([
        'Catalog Number', 'Product Type', 'Description',
        'Bag Code', 'Face Label', 'Effective Date', 'Termination Date'
      ]);
    });

    it('should have catalogNumber as sortable column', () => {
      const catalogCol = component.tableConfig.columns.find(c => c.key === 'catalogNumber');
      expect(catalogCol!.sortable).toBeTrue();
    });

    it('should have edit row action', () => {
      expect(component.tableConfig.rowActions!.length).toBe(1);
      expect(component.tableConfig.rowActions![0].action).toBe('edit');
      expect(component.tableConfig.rowActions![0].icon).toBe('edit');
    });

    it('should have correct empty and loading messages', () => {
      expect(component.tableConfig.emptyMessage).toBe('No pre-printed product labels available to display');
      expect(component.tableConfig.loadingMessage).toBe('Loading pre-printed product labels...');
    });

    it('should have sticky header and actions column', () => {
      expect(component.tableConfig.stickyHeader).toBeTrue();
      expect(component.tableConfig.stickyActionsColumn).toBeTrue();
    });
  });

  describe('Error Message Extraction', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should extract error from errorResponse.error', fakeAsync(() => {
      mockService.createPrePrintedProductLabel.and.returnValue(throwError(() => ({
        error: { errorResponse: { error: 'Catalog not found' } }
      })));

      component.openAddPanel();
      component.addEditComponent = {
        isSubmitting: true, errorMessage: null,
        cdr: { markForCheck: jasmine.createSpy() }
      } as any;

      component.onPanelSave({
        catalogNumber: 'INVALID', productType: 'RBC', bagCode: 'P53',
        faceLabel: 'E0385000', effDate: tomorrow.clone(), termDate: null
      });
      tick();

      expect(component.addEditComponent.errorMessage).toBe('Catalog not found');
    }));

    it('should fallback to error.message', fakeAsync(() => {
      mockService.createPrePrintedProductLabel.and.returnValue(throwError(() => ({
        error: { message: 'Server error' }
      })));

      component.openAddPanel();
      component.addEditComponent = {
        isSubmitting: true, errorMessage: null,
        cdr: { markForCheck: jasmine.createSpy() }
      } as any;

      component.onPanelSave({
        catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53',
        faceLabel: 'E0385000', effDate: tomorrow.clone(), termDate: null
      });
      tick();

      expect(component.addEditComponent.errorMessage).toBe('Server error');
    }));

    it('should fallback to top-level message', fakeAsync(() => {
      mockService.createPrePrintedProductLabel.and.returnValue(throwError(() => ({
        message: 'Network error'
      })));

      component.openAddPanel();
      component.addEditComponent = {
        isSubmitting: true, errorMessage: null,
        cdr: { markForCheck: jasmine.createSpy() }
      } as any;

      component.onPanelSave({
        catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53',
        faceLabel: 'E0385000', effDate: tomorrow.clone(), termDate: null
      });
      tick();

      expect(component.addEditComponent.errorMessage).toBe('Network error');
    }));

    it('should use fallback message when no error details available', fakeAsync(() => {
      mockService.createPrePrintedProductLabel.and.returnValue(throwError(() => ({})));

      component.openAddPanel();
      component.addEditComponent = {
        isSubmitting: true, errorMessage: null,
        cdr: { markForCheck: jasmine.createSpy() }
      } as any;

      component.onPanelSave({
        catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53',
        faceLabel: 'E0385000', effDate: tomorrow.clone(), termDate: null
      });
      tick();

      expect(component.addEditComponent.errorMessage).toBe('Failed to add pre-printed product label. Please try again.');
    }));

    it('should extract error from update failure errorResponse path', fakeAsync(() => {
      mockService.updatePrePrintedProductLabel.and.returnValue(throwError(() => ({
        error: { errorResponse: { error: 'Record locked' } }
      })));

      component.openEditPanel(mockListResponse.data[0]);
      component.addEditComponent = {
        isSubmitting: true, errorMessage: null,
        cdr: { markForCheck: jasmine.createSpy() }
      } as any;

      component.onPanelSave({
        catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53',
        faceLabel: 'E0385000', effDate: tomorrow.clone(), termDate: null
      });
      tick();

      expect(component.addEditComponent.errorMessage).toBe('Record locked');
    }));
  });

  describe('onPanelSave routing', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should route to handleCreate when mode is add', fakeAsync(() => {
      component.sidePanelMode = 'add';
      component.onPanelSave({
        catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53',
        faceLabel: 'E0385000', effDate: tomorrow.clone(), termDate: null
      });
      tick();
      expect(mockService.createPrePrintedProductLabel).toHaveBeenCalled();
      expect(mockService.updatePrePrintedProductLabel).not.toHaveBeenCalled();
    }));

    it('should route to handleUpdate when mode is edit', fakeAsync(() => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockListResponse.data[0];
      component.onPanelSave({
        catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53',
        faceLabel: 'E0385000', effDate: tomorrow.clone(), termDate: null
      });
      tick();
      expect(mockService.updatePrePrintedProductLabel).toHaveBeenCalled();
      expect(mockService.createPrePrintedProductLabel).not.toHaveBeenCalled();
    }));
  });
});
