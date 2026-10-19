import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import moment from 'moment';
import { NotationCodeConfigurationComponent } from './notation-code-configuration';
import { NotationCodeApiService } from './services/notation-code-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { NotationCodeTableModel } from './models/notation-code.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

@Component({ selector: 'app-page-header-with-breadcrumb', template: '', standalone: true })
class PageHeaderStub {
  @Input() config: any;
}

describe('NotationCodeConfigurationComponent', () => {
  let loggingServiceSpy: any;
  let headerServiceSpy: any;
  let menuSpy: any;
  let apiServiceSpy: any;
  let component: NotationCodeConfigurationComponent;
  let fixture: ComponentFixture<NotationCodeConfigurationComponent>;
  let notationCodeService: jasmine.SpyObj<NotationCodeApiService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;

  const mockApiItem = {
    notationCode: 'TEST01',
    notationType: 'S' as const,
    testId: null,
    shortDesc: null,
    notationDesc: 'Test Description',
    effDate: '2024-01-01T00:00:00Z',
    termDate: null,
    insertDate: '2024-01-01T00:00:00Z',
    insertUser: 'SYSTEM',
    programId: 'VCONFCFG',
    auditKey: 12345
  };

  const mockApiResponse = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: [mockApiItem],
    total: 1
  };

  const mockTableRow: NotationCodeTableModel = {
    notationCodeValue: 'TEST01',
    notationType: 'S',
    testId: null,
    shortDesc: null,
    notationDesc: 'Test Description',
    effDate: '01-JAN-2024',
    termDate: null,
    auditKey: 12345
  };

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('NotationCodeApiService', [
      'searchNotationCodes',
      'getNotationCodeLookup',
      'createNotationCode',
      'updateNotationCode',
      'deleteNotationCode',
      'getValidTests'
    ]);
    const snackbarSpy = createMockSnackbarService();
    menuSpy = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);
    headerServiceSpy = createMockHeaderService();
    loggingServiceSpy = jasmine.createSpyObj('LoggingService', ['error']);

    apiServiceSpy.searchNotationCodes.and.returnValue(of(mockApiResponse));
    apiServiceSpy.getNotationCodeLookup.and.returnValue(of([{ notationCode: 'TEST01', notationDesc: 'Test Description' }]));
    apiServiceSpy.createNotationCode.and.returnValue(of({ success: true, message: '', statusCode: 200, data: null }));
    apiServiceSpy.updateNotationCode.and.returnValue(of({ success: true, message: '', statusCode: 200, data: null }));
    apiServiceSpy.deleteNotationCode.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [] }));
    apiServiceSpy.getValidTests.and.returnValue(of([]));
    menuSpy.getMenuItemsSignal.and.returnValue(() => []);
      TestBed.configureTestingModule({
      imports: [NotationCodeConfigurationComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: NotationCodeApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: MenuService, useValue: menuSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: LoggingService, useValue: loggingServiceSpy }
      ]
    })
      .overrideComponent(NotationCodeConfigurationComponent, {
        remove: { imports: [PageHeaderWithBreadcrumb] },
        add: { imports: [PageHeaderStub] }
      });


    


      apiServiceSpy.searchNotationCodes.calls.reset();


      apiServiceSpy.getNotationCodeLookup.calls.reset();


      apiServiceSpy.createNotationCode.calls.reset();


      apiServiceSpy.updateNotationCode.calls.reset();


      apiServiceSpy.deleteNotationCode.calls.reset();


      apiServiceSpy.getValidTests.calls.reset();


      menuSpy.getMenuItemsSignal.calls.reset();


      menuSpy.findMenuItemByPath.calls.reset();


      loggingServiceSpy.error.calls.reset();


      apiServiceSpy.searchNotationCodes.and.returnValue(of(mockApiResponse));


      apiServiceSpy.getNotationCodeLookup.and.returnValue(of([{ notationCode: 'TEST01', notationDesc: 'Test Description' }]));


      apiServiceSpy.createNotationCode.and.returnValue(of({ success: true, message: '', statusCode: 200, data: null }));


      apiServiceSpy.updateNotationCode.and.returnValue(of({ success: true, message: '', statusCode: 200, data: null }));


      apiServiceSpy.deleteNotationCode.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [] }));


      apiServiceSpy.getValidTests.and.returnValue(of([]));


      menuSpy.getMenuItemsSignal.and.returnValue(() => []);


    notationCodeService = TestBed.inject(NotationCodeApiService) as jasmine.SpyObj<NotationCodeApiService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;

    fixture = TestBed.createComponent(NotationCodeConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Initialization', () => {


    it('should load notation code lookup options on init', () => {
      expect(notationCodeService.getNotationCodeLookup).toHaveBeenCalled();
      expect(component.notationCodeOptions.length).toBeGreaterThan(0);
      expect(component.notationCodeOptions[0].key).toBe('TEST01');
    });





    it('should start with panel closed', () => {
      expect(component.panelOpen).toBe(false);
    });
  });

  describe('Filter Form', () => {
    it('should not search when no notationCode is selected', () => {
      notationCodeService.searchNotationCodes.calls.reset();
      component.onFilterChange();
      expect(notationCodeService.searchNotationCodes).not.toHaveBeenCalled();
      expect(component.hasSearched).toBe(false);
    });

    it('should search when notationCode is set and onFilterChange is called', () => {
      component.filterForm.get('notationCode')!.setValue('TEST01');
      notationCodeService.searchNotationCodes.calls.reset();
      component.onFilterChange();
      expect(notationCodeService.searchNotationCodes).toHaveBeenCalled();
      expect(component.hasSearched).toBe(true);
    });

    it('should update notationTypeDescription for S type', () => {
      component.filterForm.get('notationType')!.setValue('S');
      expect(component.notationTypeDescription).toBe('Sample Notations');
    });

    it('should update notationTypeDescription for R type', () => {
      component.filterForm.get('notationType')!.setValue('R');
      expect(component.notationTypeDescription).toBe('Result Notations');
    });

    it('should update notationTypeDescription for F type', () => {
      component.filterForm.get('notationType')!.setValue('F');
      expect(component.notationTypeDescription).toBe('');
    });

    it('should clear notationTypeDescription when type is set to null', () => {
      component.filterForm.get('notationType')!.setValue('S');
      component.filterForm.get('notationType')!.setValue(null);
      expect(component.notationTypeDescription).toBe('');
    });
  });

  describe('Clear All', () => {
    beforeEach(() => {
      component.filterForm.get('notationCode')!.setValue('TEST01');
      component.filterForm.get('notationType')!.setValue('S');
      component.hasSearched = true;
      component.dataSource = [mockTableRow];
      component.selectedRow = mockTableRow;
      component.notationTypeDescription = 'Sample Notations';
    });



    it('should clear data and search state', () => {
      component.onClearAll();
      expect(component.hasSearched).toBe(false);
      expect(component.dataSource.length).toBe(0);
      expect(component.selectedRow).toBeNull();
      expect(component.notationTypeDescription).toBe('');
    });
  });

  describe('Data Loading', () => {


    it('should load and transform data when notationCode is set', () => {
      component.filterForm.get('notationCode')!.setValue('TEST01');
      component.loadData();
      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].notationCodeValue).toBe('TEST01');
      expect(component.dataSource[0].notationType).toBe('S');
    });

    it('should format effDate as DD-MMM-YYYY', () => {
      component.filterForm.get('notationCode')!.setValue('TEST01');
      component.loadData();
      expect(component.dataSource[0].effDate).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
    });






  });

  describe('Row Interactions', () => {
    beforeEach(() => {
      component.dataSource = [mockTableRow];
    });

    it('should set selectedRow on row click', () => {
      component.onRowClick(mockTableRow);
      expect(component.selectedRow).toEqual(mockTableRow);
    });




  });
  describe('Side Panel', () => {
    it('should open add panel with correct state', () => {
      component.openAddPanel();
      expect(component.panelOpen).toBe(true);
      expect(component.panelMode).toBe('add');
      expect(component.panelData).toBeNull();
    });



    it('should not override open panel when already open', () => {
      component.panelOpen = true;
      component.panelMode = 'edit';
      component.openAddPanel();
      expect(component.panelMode).toBe('edit');
    });

    it('should open edit panel with row data', () => {
      component.openEditPanel(mockTableRow);
      expect(component.panelOpen).toBe(true);
      expect(component.panelMode).toBe('edit');
      expect(component.panelData).toEqual(mockTableRow);
    });





    it('should increment panelInstanceKey on saveAndCreateAnother', () => {
      const initialKey = component.panelInstanceKey;
      const formValue = {
        notationCode: 'NEW01', notationType: 'S', testId: null,
        shortDesc: null, notationDesc: 'Description', effDate: moment(), termDate: null
      };
      component.onPanelSaveAndCreateAnother(formValue as any);
      expect(component.panelInstanceKey).toBe(initialKey + 1);
    });
  });

  describe('CRUD Operations', () => {
    it('should open edit panel on Edit row action', () => {
      spyOn(component, 'openEditPanel');
      component.onRowAction({ action: 'Edit', row: mockTableRow });
      expect(component.openEditPanel).toHaveBeenCalledWith(mockTableRow);
    });

    it('should call createNotationCode and close panel on onPanelSave in add mode', () => {
      component.panelMode = 'add';
      component.panelOpen = true;
      const formValue = {
        notationCode: 'NEW01', notationType: 'S', testId: null,
        shortDesc: null, notationDesc: 'Description', effDate: moment(), termDate: null
      };
      component.onPanelSave(formValue as any);
      expect(notationCodeService.createNotationCode).toHaveBeenCalled();
      expect(component.panelOpen).toBe(false);
    });

    it('should call updateNotationCode and close panel on onPanelSave in edit mode', () => {
      component.panelMode = 'edit';
      component.panelData = mockTableRow;
      component.panelOpen = true;
      const formValue = {
        notationCode: 'TEST01', notationType: 'S', testId: null,
        shortDesc: null, notationDesc: 'Updated Description', effDate: moment(), termDate: null
      };
      component.onPanelSave(formValue as any);
      expect(notationCodeService.updateNotationCode).toHaveBeenCalledWith('TEST01', jasmine.any(Object));
      expect(component.panelOpen).toBe(false);
    });




  });
});
