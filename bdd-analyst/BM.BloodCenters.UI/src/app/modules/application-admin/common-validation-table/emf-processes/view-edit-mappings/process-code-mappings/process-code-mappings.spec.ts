import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError, delay, Subject } from 'rxjs';
import { PageHeaderService } from '@shared/services/page-header.service';

import { ProcessCodeMappingsComponent } from './process-code-mappings';
import { ProcessMappingService } from '../../services/process-mapping.service';
import { ParameterDefinitionService } from '../../services/parameter-definition.service';
import { ProcessMappingDto } from '../../interfaces/process-mapping.interface';
import { ParameterDefinitionDto } from '../../interfaces/parameter-definition.interface';
import { MappingDetailPayload } from '../mapping-detail-panel/mapping-detail-panel';
import { AddParameterPayload } from '../add-parameter-panel/add-parameter-panel';
import { createMockMatSnackBar, createMockPageHeaderService } from '@shared/testing/common-mocks';

describe('ProcessCodeMappingsComponent', () => {
  let component: ProcessCodeMappingsComponent;
  let fixture: ComponentFixture<ProcessCodeMappingsComponent>;
  let mockMappingService: jasmine.SpyObj<ProcessMappingService>;
  let mockParamService: jasmine.SpyObj<ParameterDefinitionService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;

  const mockMappings: ProcessMappingDto[] = [
    {
      processCode: 'PROC001',
      mappingName: 'Mapping1',
      dataTableName: 'Table1',
      dataColumnName: 'Column1',
      whereClause: 'ID > 100',
      sqlStmt: 'SELECT * FROM Table1 WHERE ID > 100'
    },
    {
      processCode: 'PROC001',
      mappingName: 'Mapping2',
      dataTableName: 'Table2',
      dataColumnName: 'Column2',
      whereClause: '',
      sqlStmt: 'SELECT * FROM Table2'
    },
    {
      processCode: 'PROC001',
      mappingName: 'Mapping3',
      dataTableName: '',
      dataColumnName: '',
      whereClause: '',
      sqlStmt: 'SELECT * FROM CustomQuery'
    }
  ];

  const mockParameters: ParameterDefinitionDto[] = [
    {
      procCode: 'PROC001',
      parmNo: 1,
      parmCode: 'PARAM1',
      parmType: 'CHAR',
      refTable: 'RefTable1',
      refColumn: 'RefCol1',
      defaultValue: 'Default1'
    }
  ];

  beforeEach(() => {

    mockMappingService = jasmine.createSpyObj('ProcessMappingService', [
      'getMappings',
      'createMapping',
      'updateMapping'
    ]);
    mockParamService = jasmine.createSpyObj('ParameterDefinitionService', [
      'getParameters',
      'createParameter',
      'updateParameter',
      'deleteParameter'
    ]);
    mockSnackBar = createMockMatSnackBar();
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl']);
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');
    Object.defineProperty(mockRouter, 'events', {
      get: () => new Subject(),
      enumerable: true,
      configurable: true
    });
    mockPageHeaderService = createMockPageHeaderService();

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('PROC001')
        }
      }
    };

    mockMappingService.getMappings.and.returnValue(
      of({ data: mockMappings, totalRecords: 3 })
    );
    mockMappingService.createMapping.and.returnValue(of({ success: true }));
    mockMappingService.updateMapping.and.returnValue(of({ success: true }));
    mockParamService.getParameters.and.returnValue(of(mockParameters));
    mockParamService.createParameter.and.returnValue(of({ success: true }));
    mockParamService.updateParameter.and.returnValue(of({ success: true }));
    mockParamService.deleteParameter.and.returnValue(of({ success: true }));



      TestBed.configureTestingModule({
      imports: [
        ProcessCodeMappingsComponent,
        MatIconModule,
        MatButtonModule,
        MatTabsModule,
        MatTooltipModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: ProcessMappingService, useValue: mockMappingService },
        { provide: ParameterDefinitionService, useValue: mockParamService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: PageHeaderService, useValue: mockPageHeaderService }
      ]
    });


    


      mockMappingService.getMappings.calls.reset();


      mockMappingService.createMapping.calls.reset();


      mockMappingService.updateMapping.calls.reset();


      mockParamService.getParameters.calls.reset();


      mockParamService.createParameter.calls.reset();


      mockParamService.updateParameter.calls.reset();


      mockParamService.deleteParameter.calls.reset();


      mockRouter.navigate.calls.reset();


      mockRouter.createUrlTree.calls.reset();


      mockRouter.serializeUrl.calls.reset();


      mockPageHeaderService.getTitle.calls.reset();


      mockPageHeaderService.getSubtitle.calls.reset();


      mockPageHeaderService.getCurrentMenuItem.calls.reset();


      mockRouter.createUrlTree.and.returnValue({} as any);


      mockRouter.serializeUrl.and.returnValue('');


      mockMappingService.createMapping.and.returnValue(of({ success: true }));


      mockMappingService.updateMapping.and.returnValue(of({ success: true }));


      mockParamService.getParameters.and.returnValue(of(mockParameters));


      mockParamService.createParameter.and.returnValue(of({ success: true }));


      mockParamService.updateParameter.and.returnValue(of({ success: true }));


      mockParamService.deleteParameter.and.returnValue(of({ success: true }));


    fixture = TestBed.createComponent(ProcessCodeMappingsComponent);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {
    it('should get processCode from route params', () => {
      fixture.detectChanges();

      expect(component.processCode).toBe('PROC001');
      expect(mockActivatedRoute.snapshot.paramMap.get).toHaveBeenCalledWith('code');
    });

    it('should set header config on init', () => {
      fixture.detectChanges();

      expect(component.headerConfig.title).toBe('Mappings-PROC001');
      expect(component.headerConfig.breadcrumbs.length).toBe(3);
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
      expect(component.headerConfig.breadcrumbs[1].label).toBe('EMF Processes');
      expect(component.headerConfig.breadcrumbs[2].label).toBe('Mappings-PROC001');
    });

    it('should load mappings on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockMappingService.getMappings).toHaveBeenCalledWith(
        100,
        0,
        { processCode: 'PROC001' }
      );
      expect(component.allMappings).toEqual(mockMappings);
      expect(component.totalRecords).toBe(3);
    }));

    it('should select first mapping after load', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.selectedMapping).toEqual(mockMappings[0]);
      expect(component.isDetailPanelOpen).toBe(true);
      expect(component.detailPanelMode).toBe('edit');
    }));

    it('should handle empty mappings list', fakeAsync(() => {
      mockMappingService.getMappings.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      fixture.detectChanges();
      tick();

      expect(component.allMappings).toEqual([]);
      expect(component.filteredMappings).toEqual([]);
      expect(component.selectedMapping).toBeNull();
    }));

    it('should handle API error on load', fakeAsync(() => {
      mockMappingService.getMappings.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();
      tick();

      expect(component.allMappings).toEqual([]);
      expect(component.filteredMappings).toEqual([]);
      expect(component.isLoading()).toBe(false);
    }));
  });

  describe('Search Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));







    it('should filter mappings by SQL statement', () => {
      component.searchText = 'CustomQuery';
      component.onSearchInput();

      expect(component.filteredMappings.length).toBe(1);
      expect(component.filteredMappings[0].sqlStmt).toContain('CustomQuery');
    });



    it('should show all mappings when search is empty', () => {
      component.searchText = '';
      component.onSearchInput();

      expect(component.filteredMappings.length).toBe(3);
    });

    it('should trim search text', () => {
      component.searchText = '  Mapping1  ';
      component.onSearchInput();

      expect(component.filteredMappings.length).toBe(1);
    });


  });

  describe('Add Mapping', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should open detail panel in add mode', () => {
      component.onAddMapping();

      expect(component.isDetailPanelOpen).toBe(true);
      expect(component.detailPanelMode).toBe('add');
      expect(component.selectedMapping).toBeNull();
      expect(component.detailEditData).toBeNull();
    });

    it('should create mapping with valid payload', fakeAsync(() => {
      const payload: MappingDetailPayload = {
        mappingName: 'NewMapping',
        dataTableName: 'NewTable',
        dataColumnName: 'NewColumn',
        whereClause: 'ID = 1',
        sqlStmt: 'SELECT * FROM NewTable WHERE ID = 1'
      };

      component.detailPanelMode = 'add';
      component.onDetailPanelSave(payload);
      tick();

      expect(mockMappingService.createMapping).toHaveBeenCalledWith({
        processCode: 'PROC001',
        mappingName: 'NewMapping',
        dataTableName: 'NewTable',
        dataColumnName: 'NewColumn',
        whereClause: 'ID = 1',
        sqlStmt: 'SELECT * FROM NewTable WHERE ID = 1'
      });
    }));



    it('should show success message after create', fakeAsync(() => {
      const payload: MappingDetailPayload = {
        mappingName: 'NewMapping'
      };

      component.detailPanelMode = 'add';
      component.onDetailPanelSave(payload);
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Mapping "NewMapping" created successfully',
        'DISMISS',
        jasmine.objectContaining({
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        })
      );
    }));



    it('should keep panel open on saveAndCreateAnother', fakeAsync(() => {
      const payload: MappingDetailPayload = {
        mappingName: 'NewMapping'
      };

      component.isDetailPanelOpen = true;
      component.onDetailPanelSaveAndCreateAnother(payload);
      tick();

      expect(component.isDetailPanelOpen).toBe(true);
      expect(component.detailEditData).toBeNull();
    }));
  });

  describe('Edit Mapping', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should open detail panel in edit mode when mapping is selected', () => {
      const mapping = mockMappings[1];
      component.onSelectMapping(mapping);

      expect(component.isDetailPanelOpen).toBe(true);
      expect(component.detailPanelMode).toBe('edit');
      expect(component.selectedMapping).toEqual(mapping);
      expect(component.detailEditData).toEqual(mapping);
    });

    it('should update mapping with valid payload', fakeAsync(() => {
      component.selectedMapping = mockMappings[0];
      const payload: MappingDetailPayload = {
        mappingName: 'UpdatedMapping',
        dataTableName: 'UpdatedTable',
        dataColumnName: 'UpdatedColumn',
        whereClause: 'Status = 1',
        sqlStmt: 'SELECT * FROM UpdatedTable'
      };

      component.detailPanelMode = 'edit';
      component.onDetailPanelSave(payload);
      tick();

      expect(mockMappingService.updateMapping).toHaveBeenCalledWith(
        'PROC001',
        'Mapping1',
        jasmine.objectContaining({
          processCode: 'PROC001',
          mappingName: 'UpdatedMapping',
          dataTableName: 'UpdatedTable',
          dataColumnName: 'UpdatedColumn',
          whereClause: 'Status = 1',
          sqlStmt: 'SELECT * FROM UpdatedTable'
        })
      );
    }));

    it('should include originalMappingName when name changes', fakeAsync(() => {
      component.selectedMapping = mockMappings[0];
      const payload: MappingDetailPayload = {
        mappingName: 'NewName',
        dataTableName: 'Table1'
      };

      component.detailPanelMode = 'edit';
      component.onDetailPanelSave(payload);
      tick();

      const callArgs = mockMappingService.updateMapping.calls.mostRecent().args[2];
      expect(callArgs.originalMappingName).toBe('Mapping1');
    }));



    it('should show success message after update', fakeAsync(() => {
      component.selectedMapping = mockMappings[0];
      const payload: MappingDetailPayload = {
        mappingName: 'UpdatedMapping'
      };

      component.detailPanelMode = 'edit';
      component.onDetailPanelSave(payload);
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Mapping "UpdatedMapping" updated successfully',
        'DISMISS',
        jasmine.any(Object)
      );
    }));


  });

  describe('Detail Panel Cancel', () => {
    it('should close detail panel and clear selection', () => {
      component.isDetailPanelOpen = true;
      component.selectedMapping = mockMappings[0];
      component.detailEditData = mockMappings[0];

      component.onDetailPanelCancel();

      expect(component.isDetailPanelOpen).toBe(false);
      expect(component.selectedMapping).toBeNull();
      expect(component.detailEditData).toBeNull();
    });
  });

  describe('Parameter Management', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should open parameter panel in add mode', () => {
      component.onParamAddNew();

      expect(component.isParamPanelOpen).toBe(true);
      expect(component.paramPanelMode).toBe('add');
      expect(component.paramEditData).toBeNull();
    });

    it('should open parameter panel in edit mode', () => {
      const param = mockParameters[0];
      component.onParamEdit(param);

      expect(component.isParamPanelOpen).toBe(true);
      expect(component.paramPanelMode).toBe('edit');
      expect(component.paramEditData).toEqual(param);
    });

    it('should create parameter with valid payload', fakeAsync(() => {
      const payload: AddParameterPayload = {
        parmNo: 2,
        parmCode: 'NEW_PARAM',
        parmType: 'NUM',
        refTable: 'RefTable',
        refColumn: 'RefCol',
        defaultValue: '100'
      };

      component.paramPanelMode = 'add';
      component.onParamPanelSave(payload);
      tick();

      expect(mockParamService.createParameter).toHaveBeenCalledWith({
        procCode: 'PROC001',
        parmNo: 2,
        parmCode: 'NEW_PARAM',
        parmType: 'NUM',
        refTable: 'RefTable',
        refColumn: 'RefCol',
        defaultValue: '100'
      });
    }));

    it('should update parameter with valid payload', fakeAsync(() => {
      component.paramEditData = mockParameters[0];
      const payload: AddParameterPayload = {
        parmNo: 1,
        parmCode: 'UPDATED_PARAM',
        parmType: 'CHAR',
        refTable: 'RefTable',
        refColumn: 'RefCol',
        defaultValue: 'Updated'
      };

      component.paramPanelMode = 'edit';
      component.onParamPanelSave(payload);
      tick();

      expect(mockParamService.updateParameter).toHaveBeenCalledWith(
        'PROC001',
        1,
        jasmine.objectContaining({
          parmCode: 'UPDATED_PARAM'
        })
      );
    }));



    it('should show success message after parameter create', fakeAsync(() => {
      const payload: AddParameterPayload = {
        parmNo: 1,
        parmCode: 'NEW_PARAM',
        parmType: 'CHAR'
      };

      component.paramPanelMode = 'add';
      component.onParamPanelSave(payload);
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Parameter "NEW_PARAM" created successfully',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should show success message after parameter update', fakeAsync(() => {
      component.paramEditData = mockParameters[0];
      const payload: AddParameterPayload = {
        parmNo: 1,
        parmCode: 'UPDATED',
        parmType: 'CHAR'
      };

      component.paramPanelMode = 'edit';
      component.onParamPanelSave(payload);
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Parameter "UPDATED" updated successfully',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should cancel parameter panel', () => {
      component.isParamPanelOpen = true;
      component.paramEditData = mockParameters[0];

      component.onParamPanelCancel();

      expect(component.isParamPanelOpen).toBe(false);
      expect(component.paramEditData).toBeNull();
    });
  });

  describe('getTableNameFromSql', () => {
    it('should extract table name from simple SELECT statement', () => {
      const sql = 'SELECT * FROM TableName';
      const tableName = component.getTableNameFromSql(sql);

      expect(tableName).toBe('TableName');
    });

    it('should extract table name from SELECT with WHERE clause', () => {
      const sql = 'SELECT * FROM MyTable WHERE ID > 100';
      const tableName = component.getTableNameFromSql(sql);

      expect(tableName).toBe('MyTable');
    });

    it('should be case insensitive for FROM keyword', () => {
      const sql = 'select * from lowercase_table';
      const tableName = component.getTableNameFromSql(sql);

      expect(tableName).toBe('lowercase_table');
    });







    it('should handle table names with underscores', () => {
      const sql = 'SELECT * FROM my_table_name';
      const tableName = component.getTableNameFromSql(sql);

      expect(tableName).toBe('my_table_name');
    });

    it('should handle table names with numbers', () => {
      const sql = 'SELECT * FROM table123';
      const tableName = component.getTableNameFromSql(sql);

      expect(tableName).toBe('table123');
    });
  });

  describe('getDisplayPath', () => {
    it('should display table/mapping when table name exists', () => {
      const mapping = mockMappings[0];
      const displayPath = component.getDisplayPath(mapping);

      expect(displayPath).toBe('Table1 / Mapping1');
    });

    it('should extract table from SQL when no table name', () => {
      const mapping = mockMappings[2];
      const displayPath = component.getDisplayPath(mapping);

      expect(displayPath).toBe('CustomQuery / Mapping3');
    });

    it('should display only mapping name when no table or SQL', () => {
      const mapping: ProcessMappingDto = {
        processCode: 'PROC001',
        mappingName: 'OnlyName',
        dataTableName: '',
        sqlStmt: ''
      };

      const displayPath = component.getDisplayPath(mapping);

      expect(displayPath).toBe('OnlyName');
    });

    it('should handle SQL without extractable table name', () => {
      const mapping: ProcessMappingDto = {
        processCode: 'PROC001',
        mappingName: 'TestMapping',
        dataTableName: '',
        sqlStmt: 'INVALID SQL'
      };

      const displayPath = component.getDisplayPath(mapping);

      expect(displayPath).toBe('TestMapping');
    });
  });

  describe('trackById', () => {
    it('should return unique identifier for mapping', () => {
      const mapping = mockMappings[0];
      const trackId = component.trackById(0, mapping);

      expect(trackId).toBe('PROC001-Mapping1');
    });

    it('should return different ids for different mappings', () => {
      const mapping1 = mockMappings[0];
      const mapping2 = mockMappings[1];

      const trackId1 = component.trackById(0, mapping1);
      const trackId2 = component.trackById(1, mapping2);

      expect(trackId1).not.toBe(trackId2);
    });
  });
});
