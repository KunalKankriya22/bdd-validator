import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { CryoMethodsComponent } from './cryo-methods.component';
import { CryoMethodModel, CryoMethodFormValue, CryoMethodDto } from './models/cryo-methods.model';
import { CryoMethodsService } from './services/cryo-methods.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { TablePageEvent, TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import moment from 'moment';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('CryoMethodsComponent', () => {
  let loadSpy: any;
  let loadDataSpy: any;
  let component: CryoMethodsComponent;
  let fixture: ComponentFixture<CryoMethodsComponent>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockMenuService: jasmine.SpyObj<MenuService>;
  let mockCryoMethodsService: jasmine.SpyObj<CryoMethodsService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let chapterSubject: Subject<void>;

  const mockData: CryoMethodDto[] = [
    {
      thawMethod: 'Bath',
      methodDesc: 'Water Bath Method',
      minTemp: 1.00,
      maxTemp: 6.00,
      minWsFreezeTime: 0.01,
      maxWsFreezeTime: 6.00,
      minSepFreezeTime: 0.10,
      maxSepFreezeTime: 0.55,
      effDate: '2012-10-07',
      termDate: '2012-10-15',
      lastModifiedDate: '2012-10-07T00:00:00Z'
    },
    {
      thawMethod: 'Ref',
      methodDesc: 'Refrigerator Thaw',
      minTemp: 1.00,
      maxTemp: 6.00,
      minWsFreezeTime: 0.01,
      maxWsFreezeTime: 17.50,
      minSepFreezeTime: 0.00,
      maxSepFreezeTime: 0.55,
      effDate: '2012-10-07',
      termDate: '2012-10-19',
      lastModifiedDate: '2012-10-07T00:00:00Z'
    }
  ];

  beforeEach(() => {

    chapterSubject = new Subject<void>();

    mockHeaderService = createMockHeaderService({ chapterChanged$: chapterSubject.asObservable() });
    mockMenuService = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);
    mockMenuService.getMenuItemsSignal.and.returnValue(signal([]));

    mockCryoMethodsService = jasmine.createSpyObj('CryoMethodsService', [
      'getCryoMethods',
      'createCryoMethod',
      'updateCryoMethod',
      'deleteCryoMethod'
    ]);
    mockCryoMethodsService.getCryoMethods.and.returnValue(
      of({ data: mockData, totalRecords: mockData.length })
    );
    mockCryoMethodsService.createCryoMethod.and.returnValue(
      of({ success: true, message: 'Cryo method created successfully' })
    );
    mockCryoMethodsService.updateCryoMethod.and.returnValue(
      of({ success: true, message: 'Cryo method updated successfully' })
    );

    mockSnackbarService = createMockSnackbarService();



      TestBed.configureTestingModule({
      imports: [
        CryoMethodsComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MenuService, useValue: mockMenuService },
        { provide: CryoMethodsService, useValue: mockCryoMethodsService },
        { provide: SnackbarService, useValue: mockSnackbarService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

      mockMenuService.getMenuItemsSignal.and.returnValue(signal([]));


    fixture = TestBed.createComponent(CryoMethodsComponent);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {
    it('should load mock data on init', fakeAsync(() => {
      fixture.detectChanges();
      tick(400);

      expect(component.dataSource.length).toBe(2);
      expect(component.dataSource[0].thawMethod).toBe('Bath');
      expect(component.isLoading).toBeFalse();
    }));

    it('should initialize table configuration correctly', () => {
      expect(component.tableConfig.columns.length).toBeGreaterThan(0);
      expect(component.tableConfig.rowActions?.length).toBeGreaterThan(0);
      expect(component.tableConfig.pagination?.pageSize).toBe(25);
    });









    it('should set total records after data load', fakeAsync(() => {
      fixture.detectChanges();
      tick(400);

      expect(component.tableConfig.pagination?.totalRecords).toBe(2);
    }));

    it('should initialize searchConfig correctly', () => {
      expect(component.searchConfig.placeholder).toBe('Search by Thaw Method');
      expect(component.searchConfig.minLength).toBe(3);
      expect(component.searchConfig.ariaLabel).toBe('Search cryo methods');
    });

    it('should initialize headerConfig with ADD NEW CRYO METHOD action', () => {
      expect(component.headerConfig.actions!.length).toBe(1);
      expect(component.headerConfig.actions![0].label).toBe('ADD NEW CRYO METHOD');
      expect(component.headerConfig.actions![0].icon).toBe('add');
    });

    it('should call openAddDrawer when header action onClick is invoked', () => {
      spyOn(component, 'openAddDrawer');
      component.headerConfig.actions![0].onClick!();
      expect(component.openAddDrawer).toHaveBeenCalled();
    });

    it('should initialize requestState as empty object', () => {
      expect(component.requestState).toEqual({});
    });

    it('should set isLoading to false initially', () => {
      expect(component.isLoading).toBeFalse();
    });

    it('should set sidePanelOpen to false initially', () => {
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should set sidePanelMode to add initially', () => {
      expect(component.sidePanelMode).toBe('add');
    });

    it('should set sidePanelData to null initially', () => {
      expect(component.sidePanelData).toBeNull();
    });

    it('should include sortable column for thawMethod', () => {
      const thawMethodCol = component.tableConfig.columns.find(c => c.key === 'thawMethod');
      expect(thawMethodCol).toBeDefined();
      expect(thawMethodCol!.sortable).toBeTrue();
    });

    it('should have edit row action', () => {
      expect(component.tableConfig.rowActions![0].action).toBe('edit');
      expect(component.tableConfig.rowActions![0].icon).toBe('edit');
    });

    it('should set emptyMessage in table config', () => {
      expect(component.tableConfig.emptyMessage).toBe('No CRYO methods available to display');
    });

    it('should set loadingMessage in table config', () => {
      expect(component.tableConfig.loadingMessage).toBe('Loading CRYO methods...');
    });

    it('should subscribe to chapter changes on init', fakeAsync(() => {
      fixture.detectChanges();
      tick(400);
      const loadSpy = spyOn(component, 'loadData');
      chapterSubject.next();
      tick();
      expect(loadSpy).toHaveBeenCalled();
    }));
  });

  describe('Search functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(400);
    }));

    it('should set search keyword and call loadData', () => {
      loadDataSpy = spyOn(component, 'loadData');

      component.onSearch('Bath');

      expect(component.requestState.thawMethod).toBe('Bath');
      expect(loadDataSpy).toHaveBeenCalled();
    });

    it('should clear search keyword when search is empty', () => {
      loadDataSpy = spyOn(component, 'loadData');
      component.requestState.thawMethod = 'Bath';

      component.onSearch('');

      expect(component.requestState.thawMethod).toBeUndefined();
      expect(loadDataSpy).toHaveBeenCalled();
    });

    it('should reset page index to 0 on search', () => {
      loadDataSpy = spyOn(component, 'loadData');
      component.tableConfig.pagination!.pageIndex = 3;

      component.onSearch('Test');

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should set thawMethod to undefined when search text is null-ish', () => {
      loadDataSpy = spyOn(component, 'loadData');
      component.onSearch('');
      expect(component.requestState.thawMethod).toBeUndefined();
    });
  });


  describe('Side panel', () => {
    it('should open add drawer', () => {
      component.openAddDrawer();

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should open edit drawer with data', () => {
      component.openEditDrawer(mockData[0]);

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockData[0]);
    });



    it('should call closeSidePanel on save', () => {
      component.sidePanelOpen = true;
      const formValue: CryoMethodFormValue = {
        thawMethod: 'Test',
        methodDesc: 'Test Desc',
        minTemp: null,
        maxTemp: null,
        minWsFreezeTime: null,
        maxWsFreezeTime: null,
        minSepFreezeTime: null,
        maxSepFreezeTime: null,
        effDate: moment(),
        termDate: null
      };

      component.onSidePanelSave(formValue);

      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should keep panel open on save and create another', () => {
      component.sidePanelOpen = true;
      component.sidePanelMode = 'add';

      component.sideDrawer = jasmine.createSpyObj('AddEditCryoMethodComponent', [], {
        form: jasmine.createSpyObj('FormGroup', ['reset']),
        isSubmitting: false
      }) as any;

      const formValue: CryoMethodFormValue = {
        thawMethod: 'Test',
        methodDesc: 'Test Desc',
        minTemp: null,
        maxTemp: null,
        minWsFreezeTime: null,
        maxWsFreezeTime: null,
        minSepFreezeTime: null,
        maxSepFreezeTime: null,
        effDate: moment(),
        termDate: null
      };

      component.onSidePanelSaveAndCreateAnother(formValue);

      expect(component.sidePanelOpen).toBeTrue();
    });

    it('should clear dataTableComponent activeRow when opening add drawer', () => {
      const mockDataTable = { activeRow: mockData[0] } as any;
      component.dataTableComponent = mockDataTable;

      component.openAddDrawer();

      expect(mockDataTable.activeRow).toBeNull();
    });

    it('should set dataTableComponent activeRow when opening edit drawer', () => {
      const mockDataTable = { activeRow: null } as any;
      component.dataTableComponent = mockDataTable;

      component.openEditDrawer(mockData[0]);

      expect(mockDataTable.activeRow).toEqual(mockData[0]);
    });

    it('should clear dataTableComponent activeRow when closing side panel', () => {
      const mockDataTable = { activeRow: mockData[0] } as any;
      component.dataTableComponent = mockDataTable;
      component.sidePanelOpen = true;

      component.closeSidePanel();

      expect(mockDataTable.activeRow).toBeNull();
    });

    it('should route to createCryoMethod in add mode', () => {
      component.sidePanelMode = 'add';
      const formValue: CryoMethodFormValue = {
        thawMethod: 'Test', methodDesc: 'Desc', minTemp: 1, maxTemp: 6,
        minWsFreezeTime: 0.01, maxWsFreezeTime: 6, minSepFreezeTime: 0.1,
        maxSepFreezeTime: 0.55, effDate: moment(), termDate: null
      };
      component.onSidePanelSave(formValue);
      expect(mockCryoMethodsService.createCryoMethod).toHaveBeenCalled();
    });

    it('should route to updateCryoMethod in edit mode', () => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[0];
      const formValue: CryoMethodFormValue = {
        thawMethod: 'Bath', methodDesc: 'Updated', minTemp: 1, maxTemp: 6,
        minWsFreezeTime: 0.01, maxWsFreezeTime: 6, minSepFreezeTime: 0.1,
        maxSepFreezeTime: 0.55, effDate: moment(), termDate: null
      };
      component.onSidePanelSave(formValue);
      expect(mockCryoMethodsService.updateCryoMethod).toHaveBeenCalled();
    });
  });
  describe('Decimal formatting', () => {
    it('should format decimal values', () => {
      const formatted = component['formatDecimal'](1.5);

      expect(formatted).toBe('1.50');
    });

    it('should return dash for null values', () => {
      const formatted = component['formatDecimal'](null);

      expect(formatted).toBe('–');
    });

    it('should return dash for undefined values', () => {
      const formatted = component['formatDecimal'](undefined);

      expect(formatted).toBe('–');
    });

    it('should format zero correctly', () => {
      const formatted = component['formatDecimal'](0);

      expect(formatted).toBe('0.00');
    });

    it('should format integer values with two decimal places', () => {
      const formatted = component['formatDecimal'](5);

      expect(formatted).toBe('5.00');
    });

    it('should format values with many decimal places', () => {
      const formatted = component['formatDecimal'](3.14159);

      expect(formatted).toBe('3.14');
    });
  });
  describe('Chapter changes', () => {
    it('should reload data on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick(400);

      loadSpy = spyOn(component, 'loadData');
      chapterSubject.next();
      tick();

      expect(loadSpy).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBeFalse();
    }));
  });

  describe('Pagination', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(400);
    }));

    it('should update pagination and reload on page change', () => {
      loadDataSpy = spyOn(component, 'loadData');
      component.onPageChange({ pageIndex: 2, pageSize: 50 });
      expect(component.tableConfig.pagination!.pageIndex).toBe(2);
      expect(component.tableConfig.pagination!.pageSize).toBe(50);
      expect(loadDataSpy).toHaveBeenCalled();
    });
  });

  describe('Sorting', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(400);
    }));

    it('should set ASC sort order', () => {
      loadDataSpy = spyOn(component, 'loadData');
      component.onSortChange({ column: 'thawMethod', direction: 'A' });
      expect(component.requestState.sortColumn).toBe('ThawMethod');
      expect(component.requestState.sortOrder).toBe('ASC');
      expect(loadDataSpy).toHaveBeenCalled();
    });

    it('should set DESC sort order', () => {
      loadDataSpy = spyOn(component, 'loadData');
      component.onSortChange({ column: 'thawMethod', direction: 'D' });
      expect(component.requestState.sortOrder).toBe('DESC');
    });

    it('should clear sort for default direction', () => {
      loadDataSpy = spyOn(component, 'loadData');
      component.onSortChange({ column: 'thawMethod', direction: 'default' });
      expect(component.requestState.sortColumn).toBeUndefined();
      expect(component.requestState.sortOrder).toBeUndefined();
    });

    it('should use column name as-is when not in columnMap', () => {
      loadDataSpy = spyOn(component, 'loadData');
      component.onSortChange({ column: 'methodDesc', direction: 'A' });
      expect(component.requestState.sortColumn).toBe('methodDesc');
    });

    it('should update tableConfig sortConfig column and direction', () => {
      loadDataSpy = spyOn(component, 'loadData');
      component.onSortChange({ column: 'thawMethod', direction: 'A' });
      expect(component.tableConfig.sortConfig!.column).toBe('thawMethod');
      expect(component.tableConfig.sortConfig!.direction).toBe('A');
    });

    it('should reset page index to 0 on sort change', () => {
      loadDataSpy = spyOn(component, 'loadData');
      component.tableConfig.pagination!.pageIndex = 5;
      component.onSortChange({ column: 'thawMethod', direction: 'A' });
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should clear sortConfig when returning to default', () => {
      loadDataSpy = spyOn(component, 'loadData');
      // First set a sort
      component.onSortChange({ column: 'thawMethod', direction: 'A' });
      // Then clear it
      component.onSortChange({ column: 'thawMethod', direction: 'default' });
      expect(component.tableConfig.sortConfig!.direction).toBe('default');
      expect(component.requestState.sortColumn).toBeUndefined();
      expect(component.requestState.sortOrder).toBeUndefined();
    });
  });

  describe('Row action', () => {
    it('should open edit drawer on row action', () => {
      spyOn(component, 'openEditDrawer');
      component.onRowAction({ action: 'edit', row: mockData[0] });
      expect(component.openEditDrawer).toHaveBeenCalledWith(mockData[0]);
    });

    it('should not open edit drawer for unknown action', () => {
      spyOn(component, 'openEditDrawer');
      component.onRowAction({ action: 'delete', row: mockData[0] });
      expect(component.openEditDrawer).not.toHaveBeenCalled();
    });

    it('should set dataTableComponent activeRow on edit row action', () => {
      const mockDataTable = { activeRow: null } as any;
      component.dataTableComponent = mockDataTable;
      spyOn(component, 'openEditDrawer');
      component.onRowAction({ action: 'edit', row: mockData[0] });
      expect(mockDataTable.activeRow).toEqual(mockData[0]);
    });
  });

  describe('Close side panel', () => {
    it('should close panel and clear data', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockData[0];
      component.closeSidePanel();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('Load data error', () => {
    it('should handle error from API with errorResponse', fakeAsync(() => {
      const snackSpy = spyOn((component as any).snackbarService, 'showError');
      mockCryoMethodsService.getCryoMethods.and.returnValue(
        throwError(() => ({ error: { errorResponse: { errorCode: '1001', error: 'DB Error' } } }))
      );
      component.loadData();
      tick();
      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
      expect(snackSpy).toHaveBeenCalledWith('1001: DB Error');
    }));

    it('should handle error from API with message fallback', fakeAsync(() => {
      const snackSpy = spyOn((component as any).snackbarService, 'showError');
      mockCryoMethodsService.getCryoMethods.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );
      component.loadData();
      tick();
      expect(snackSpy).toHaveBeenCalledWith('Server error');
    }));

    it('should handle error with generic fallback', fakeAsync(() => {
      const snackSpy = spyOn((component as any).snackbarService, 'showError');
      mockCryoMethodsService.getCryoMethods.and.returnValue(
        throwError(() => ({ status: 500 }))
      );
      component.loadData();
      tick();
      expect(snackSpy).toHaveBeenCalledWith('Failed to load cryo methods');
    }));
  });

  describe('Create cryo method error branches', () => {
    const baseFormValue: CryoMethodFormValue = {
      thawMethod: 'Test', methodDesc: 'Desc', minTemp: 1, maxTemp: 6,
      minWsFreezeTime: 0.01, maxWsFreezeTime: 6, minSepFreezeTime: 0.1,
      maxSepFreezeTime: 0.55, effDate: moment(), termDate: null
    };

    it('should show error when create returns success false with errorResponse', fakeAsync(() => {
      const snackSpy = spyOn((component as any).snackbarService, 'showError');
      mockCryoMethodsService.createCryoMethod.and.returnValue(
        of({ success: false, errorResponse: { errorCode: '2001', error: 'Duplicate' } } as any)
      );

      component.sideDrawer = jasmine.createSpyObj('Drawer', [], { isSubmitting: true });
      component.sidePanelMode = 'add';
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(snackSpy).toHaveBeenCalledWith('2001: Duplicate');
    }));

    it('should show error when create returns success false without errorResponse', fakeAsync(() => {
      const snackSpy = spyOn((component as any).snackbarService, 'showError');
      mockCryoMethodsService.createCryoMethod.and.returnValue(
        of({ success: false, message: 'Failed to create cryo method' } as any)
      );

      component.sidePanelMode = 'add';
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(snackSpy).toHaveBeenCalledWith('Failed to create cryo method');
    }));

    it('should handle API error on create with errorResponse', fakeAsync(() => {
      const snackSpy = spyOn((component as any).snackbarService, 'showError');
      mockCryoMethodsService.createCryoMethod.and.returnValue(
        throwError(() => ({ error: { errorResponse: { errorCode: '3001', error: 'Constraint' } } }))
      );

      component.sideDrawer = jasmine.createSpyObj('Drawer', [], { isSubmitting: true });
      component.sidePanelMode = 'add';
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(snackSpy).toHaveBeenCalledWith('3001: Constraint');
    }));

    it('should handle API error on create with generic fallback', fakeAsync(() => {
      const snackSpy = spyOn((component as any).snackbarService, 'showError');
      mockCryoMethodsService.createCryoMethod.and.returnValue(
        throwError(() => ({ status: 500 }))
      );

      component.sidePanelMode = 'add';
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(snackSpy).toHaveBeenCalledWith('Failed to create cryo method');
    }));
  });

  describe('Update cryo method', () => {
    const baseFormValue: CryoMethodFormValue = {
      thawMethod: 'Bath', methodDesc: 'Updated', minTemp: 1, maxTemp: 6,
      minWsFreezeTime: 0.01, maxWsFreezeTime: 6, minSepFreezeTime: 0.1,
      maxSepFreezeTime: 0.55, effDate: moment(), termDate: null
    };

    it('should call update when sidePanelMode is edit', fakeAsync(() => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[0];
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(mockCryoMethodsService.updateCryoMethod).toHaveBeenCalledWith('Bath', jasmine.any(Object));
    }));

    it('should do nothing when sidePanelData is null in edit mode', () => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = null;
      component.onSidePanelSave(baseFormValue);
      expect(mockCryoMethodsService.updateCryoMethod).not.toHaveBeenCalled();
    });

    it('should show error when update returns success false with errorResponse', fakeAsync(() => {
      const snackSpy = spyOn((component as any).snackbarService, 'showError');
      mockCryoMethodsService.updateCryoMethod.and.returnValue(
        of({ success: false, errorResponse: { errorCode: '4001', error: 'Invalid' } } as any)
      );

      component.sideDrawer = jasmine.createSpyObj('Drawer', [], { isSubmitting: true });
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[0];
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(snackSpy).toHaveBeenCalledWith('4001: Invalid');
    }));

    it('should handle API error on update with errorResponse', fakeAsync(() => {
      const snackSpy = spyOn((component as any).snackbarService, 'showError');
      mockCryoMethodsService.updateCryoMethod.and.returnValue(
        throwError(() => ({ error: { errorResponse: { errorCode: '5001', error: 'Server fail' } } }))
      );

      component.sideDrawer = jasmine.createSpyObj('Drawer', [], { isSubmitting: true });
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[0];
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(snackSpy).toHaveBeenCalledWith('5001: Server fail');
    }));

    it('should handle API error on update with generic fallback', fakeAsync(() => {
      const snackSpy = spyOn((component as any).snackbarService, 'showError');
      mockCryoMethodsService.updateCryoMethod.and.returnValue(
        throwError(() => ({ status: 500 }))
      );

      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[0];
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(snackSpy).toHaveBeenCalledWith('Failed to update cryo method');
    }));
  });

  describe('Keyboard shortcuts', () => {
    it('should close side panel on Escape', () => {
      component.sidePanelOpen = true;
      spyOn(component, 'closeSidePanel');
      component.handleKeyboardShortcut(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(component.closeSidePanel).toHaveBeenCalled();
    });

    it('should not close side panel on Escape when closed', () => {
      component.sidePanelOpen = false;
      spyOn(component, 'closeSidePanel');
      component.handleKeyboardShortcut(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(component.closeSidePanel).not.toHaveBeenCalled();
    });

    it('should focus search on Alt+S', () => {
      component.searchBarComponent = jasmine.createSpyObj('SearchBar', ['focus']) as any;
      const event = new KeyboardEvent('keydown', { altKey: true, key: 's' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardShortcut(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.searchBarComponent.focus).toHaveBeenCalled();
    });
  });

  describe('Date formatting', () => {
    it('should format valid dates', () => {
      const result = component['formatDate']('2024-01-15');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should return dash for null dates', () => {
      expect(component['formatDate'](null)).toBe('–');
    });

    it('should return dash for undefined dates', () => {
      expect(component['formatDate'](undefined)).toBe('–');
    });

    it('should format Date object', () => {
      const result = component['formatDate'](new Date(2023, 5, 15));
      expect(result).toMatch(/15-JUN-2023/);
    });

    it('should return dash for empty string date', () => {
      // new Date('') is Invalid Date, but the code calls new Date(date)
      // An empty string is falsy so it hits !date
      expect(component['formatDate']('')).toBe('–');
    });
  });

  describe('ngOnDestroy', () => {
    it('should emit destroy$ and complete it', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should unsubscribe from chapter changes on destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick(400);
      component.ngOnDestroy();

      const loadSpy = spyOn(component, 'loadData');
      chapterSubject.next();
      tick();
      expect(loadSpy).not.toHaveBeenCalled();
    }));
  });

  describe('loadData state transitions', () => {
    it('should set isLoading to true at start of loadData', () => {
      // Reset the service to return a subject we can control
      const controlSubject = new Subject<any>();
      mockCryoMethodsService.getCryoMethods.and.returnValue(controlSubject.asObservable());

      component.loadData();

      expect(component.isLoading).toBeTrue();
      expect(component.hasError).toBeFalse();

      // Complete the observable to avoid leaks
      controlSubject.next({ data: [], totalRecords: 0 });
      controlSubject.complete();
    });

    it('should set isLoading to false after successful load', fakeAsync(() => {
      mockCryoMethodsService.getCryoMethods.and.returnValue(
        of({ data: mockData, totalRecords: 2 })
      );
      component.loadData();
      tick();
      expect(component.isLoading).toBeFalse();
    }));

    it('should set hasError to true and isLoading to false on error', fakeAsync(() => {
      mockCryoMethodsService.getCryoMethods.and.returnValue(
        throwError(() => ({ status: 500 }))
      );
      component.loadData();
      tick();
      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
    }));

    it('should compute skip from pageIndex and pageSize', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 10;
      mockCryoMethodsService.getCryoMethods.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      component.loadData();
      tick();
      expect(mockCryoMethodsService.getCryoMethods).toHaveBeenCalledWith(10, 20, component.requestState);
    }));

    it('should spread data into a new array', fakeAsync(() => {
      mockCryoMethodsService.getCryoMethods.and.returnValue(
        of({ data: mockData, totalRecords: 2 })
      );
      component.loadData();
      tick();
      expect(component.dataSource).not.toBe(mockData as any);
      expect(component.dataSource).toEqual(mockData);
    }));
  });

  describe('Create cryo method success path', () => {
    const baseFormValue: CryoMethodFormValue = {
      thawMethod: 'Test', methodDesc: 'Desc', minTemp: 1, maxTemp: 6,
      minWsFreezeTime: 0.01, maxWsFreezeTime: 6, minSepFreezeTime: 0.1,
      maxSepFreezeTime: 0.55, effDate: moment(), termDate: null
    };

    it('should show success snackbar with custom message on create success', fakeAsync(() => {
      mockCryoMethodsService.createCryoMethod.and.returnValue(
        of({ success: true, message: 'Custom success message' })
      );
      component.sidePanelMode = 'add';
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Custom success message');
    }));

    it('should show default success message when response has no message', fakeAsync(() => {
      mockCryoMethodsService.createCryoMethod.and.returnValue(
        of({ success: true })
      );
      component.sidePanelMode = 'add';
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Cryo method created successfully');
    }));

    it('should close side panel after successful create without createAnother', fakeAsync(() => {
      mockCryoMethodsService.createCryoMethod.and.returnValue(
        of({ success: true, message: 'Created' })
      );
      component.sidePanelOpen = true;
      component.sidePanelMode = 'add';
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(component.sidePanelOpen).toBeFalse();
    }));

    it('should reset form and keep panel open on createAnother', () => {
      // Verify that closeSidePanel is NOT called when createAnother is true
      spyOn(component, 'closeSidePanel');
      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;
      component.onSidePanelSaveAndCreateAnother(baseFormValue);
      expect(mockCryoMethodsService.createCryoMethod).toHaveBeenCalled();
      expect(component.closeSidePanel).not.toHaveBeenCalled();
      expect(component.sidePanelOpen).toBeTrue();
    });

    it('should reload data after successful create', fakeAsync(() => {
      mockCryoMethodsService.createCryoMethod.and.returnValue(
        of({ success: true, message: 'Created' })
      );
      component.sidePanelMode = 'add';
      const loadDataSpy = spyOn(component, 'loadData');
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(loadDataSpy).toHaveBeenCalled();
    }));
  });

  describe('Create cryo method additional error paths', () => {
    const baseFormValue: CryoMethodFormValue = {
      thawMethod: 'Test', methodDesc: 'Desc', minTemp: 1, maxTemp: 6,
      minWsFreezeTime: 0.01, maxWsFreezeTime: 6, minSepFreezeTime: 0.1,
      maxSepFreezeTime: 0.55, effDate: moment(), termDate: null
    };

    it('should show default error message when success is false with no errorResponse and no message', fakeAsync(() => {
      mockCryoMethodsService.createCryoMethod.and.returnValue(
        of({ success: false } as any)
      );
      component.sidePanelMode = 'add';
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to create cryo method');
    }));

    it('should reset isSubmitting on sideDrawer when create returns success false', fakeAsync(() => {
      component.sideDrawer = { isSubmitting: true } as any;
      mockCryoMethodsService.createCryoMethod.and.returnValue(
        of({ success: false, message: 'Oops' } as any)
      );
      component.sidePanelMode = 'add';
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(component.sideDrawer.isSubmitting).toBeFalse();
    }));

    it('should handle API error on create with error.error.message', fakeAsync(() => {
      mockCryoMethodsService.createCryoMethod.and.returnValue(
        throwError(() => ({ error: { message: 'Specific server error' } }))
      );
      component.sidePanelMode = 'add';
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Specific server error');
    }));

    it('should reset isSubmitting on sideDrawer when create has API error', fakeAsync(() => {
      component.sideDrawer = { isSubmitting: true } as any;
      mockCryoMethodsService.createCryoMethod.and.returnValue(
        throwError(() => ({ error: { message: 'Err' } }))
      );
      component.sidePanelMode = 'add';
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(component.sideDrawer.isSubmitting).toBeFalse();
    }));
  });

  describe('Update cryo method additional paths', () => {
    const baseFormValue: CryoMethodFormValue = {
      thawMethod: 'Bath', methodDesc: 'Updated', minTemp: 1, maxTemp: 6,
      minWsFreezeTime: 0.01, maxWsFreezeTime: 6, minSepFreezeTime: 0.1,
      maxSepFreezeTime: 0.55, effDate: moment(), termDate: null
    };

    it('should show default success message when update response has no message', fakeAsync(() => {
      mockCryoMethodsService.updateCryoMethod.and.returnValue(
        of({ success: true })
      );
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[0];
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Cryo method updated successfully');
    }));

    it('should close side panel after successful update', fakeAsync(() => {
      mockCryoMethodsService.updateCryoMethod.and.returnValue(
        of({ success: true, message: 'Updated' })
      );
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[0];
      component.sidePanelOpen = true;
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(component.sidePanelOpen).toBeFalse();
    }));

    it('should reload data after successful update', fakeAsync(() => {
      mockCryoMethodsService.updateCryoMethod.and.returnValue(
        of({ success: true, message: 'Updated' })
      );
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[0];
      const loadSpy = spyOn(component, 'loadData');
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(loadSpy).toHaveBeenCalled();
    }));

    it('should show message fallback when update returns success false without errorResponse', fakeAsync(() => {
      mockCryoMethodsService.updateCryoMethod.and.returnValue(
        of({ success: false, message: 'Custom failure' } as any)
      );
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[0];
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Custom failure');
    }));

    it('should show default error when update returns success false without errorResponse and without message', fakeAsync(() => {
      mockCryoMethodsService.updateCryoMethod.and.returnValue(
        of({ success: false } as any)
      );
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[0];
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to update cryo method');
    }));

    it('should reset isSubmitting on sideDrawer when update returns success false', fakeAsync(() => {
      component.sideDrawer = { isSubmitting: true } as any;
      mockCryoMethodsService.updateCryoMethod.and.returnValue(
        of({ success: false, message: 'Error' } as any)
      );
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[0];
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(component.sideDrawer.isSubmitting).toBeFalse();
    }));

    it('should handle API error on update with error.error.message', fakeAsync(() => {
      mockCryoMethodsService.updateCryoMethod.and.returnValue(
        throwError(() => ({ error: { message: 'Update server error' } }))
      );
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[0];
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Update server error');
    }));

    it('should reset isSubmitting on sideDrawer when update has API error', fakeAsync(() => {
      component.sideDrawer = { isSubmitting: true } as any;
      mockCryoMethodsService.updateCryoMethod.and.returnValue(
        throwError(() => ({ error: { message: 'Err' } }))
      );
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[0];
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(component.sideDrawer.isSubmitting).toBeFalse();
    }));

    it('should use thawMethod from sidePanelData for update call', fakeAsync(() => {
      mockCryoMethodsService.updateCryoMethod.and.returnValue(
        of({ success: true })
      );
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[1]; // 'Ref'
      component.onSidePanelSave(baseFormValue);
      tick();
      expect(mockCryoMethodsService.updateCryoMethod).toHaveBeenCalledWith('Ref', jasmine.any(Object));
    }));
  });

  describe('Keyboard shortcuts additional', () => {
    it('should not throw when Alt+S pressed and searchBarComponent is undefined', () => {
      component.searchBarComponent = undefined as any;
      const event = new KeyboardEvent('keydown', { altKey: true, key: 's' });
      expect(() => component.handleKeyboardShortcut(event)).not.toThrow();
    });

    it('should not react to unrelated keys', () => {
      spyOn(component, 'closeSidePanel');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.handleKeyboardShortcut(event);
      expect(component.closeSidePanel).not.toHaveBeenCalled();
    });

    it('should handle Alt+S with uppercase S', () => {
      component.searchBarComponent = jasmine.createSpyObj('SearchBar', ['focus']) as any;
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'S' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardShortcut(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.searchBarComponent.focus).toHaveBeenCalled();
    });

    it('should not focus search for s key without alt', () => {
      component.searchBarComponent = jasmine.createSpyObj('SearchBar', ['focus']) as any;
      const event = new KeyboardEvent('keydown', { key: 's' });
      component.handleKeyboardShortcut(event);
      expect(component.searchBarComponent.focus).not.toHaveBeenCalled();
    });
  });

  describe('Chapter changes additional', () => {
    it('should close side panel on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick(400);

      component.sidePanelOpen = true;
      chapterSubject.next();
      tick();
      expect(component.sidePanelOpen).toBeFalse();
    }));
  });

  describe('Table column value formatters', () => {
    it('should have valueFormatter for minTemp column', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'minTemp');
      expect(col).toBeDefined();
      expect(col!.valueFormatter).toBeDefined();
      expect(col!.valueFormatter!(1.5)).toBe('1.50');
      expect(col!.valueFormatter!(null)).toBe('–');
    });

    it('should have valueFormatter for maxTemp column', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'maxTemp');
      expect(col).toBeDefined();
      expect(col!.valueFormatter!(0)).toBe('0.00');
    });

    it('should have valueFormatter for effDate column', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'effDate');
      expect(col).toBeDefined();
      expect(col!.valueFormatter!(null)).toBe('–');
      expect(col!.valueFormatter!('2024-01-15')).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should have valueFormatter for termDate column', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'termDate');
      expect(col).toBeDefined();
      expect(col!.valueFormatter!(null)).toBe('–');
    });

    it('should have valueFormatter for minWsFreezeTime column', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'minWsFreezeTime');
      expect(col).toBeDefined();
      expect(col!.valueFormatter!(2.5)).toBe('2.50');
    });

    it('should have valueFormatter for maxWsFreezeTime column', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'maxWsFreezeTime');
      expect(col).toBeDefined();
      expect(col!.valueFormatter!(17.5)).toBe('17.50');
    });

    it('should have valueFormatter for minSepFreezeTime column', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'minSepFreezeTime');
      expect(col).toBeDefined();
      expect(col!.valueFormatter!(0.1)).toBe('0.10');
    });

    it('should have valueFormatter for maxSepFreezeTime column', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'maxSepFreezeTime');
      expect(col).toBeDefined();
      expect(col!.valueFormatter!(0.55)).toBe('0.55');
    });
  });

  describe('Pagination additional', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(400);
    }));

    it('should handle page size change', () => {
      loadDataSpy = spyOn(component, 'loadData');
      component.onPageChange({ pageIndex: 0, pageSize: 100 });
      expect(component.tableConfig.pagination!.pageSize).toBe(100);
      expect(loadDataSpy).toHaveBeenCalled();
    });

    it('should handle going back to first page', () => {
      loadDataSpy = spyOn(component, 'loadData');
      component.tableConfig.pagination!.pageIndex = 5;
      component.onPageChange({ pageIndex: 0, pageSize: 25 });
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });
  });

  describe('Load data error with error.message fallback', () => {
    it('should use error.message when error.error is undefined', fakeAsync(() => {
      mockCryoMethodsService.getCryoMethods.and.returnValue(
        throwError(() => ({ message: 'Network error' }))
      );
      component.loadData();
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Network error');
    }));
  });
});
