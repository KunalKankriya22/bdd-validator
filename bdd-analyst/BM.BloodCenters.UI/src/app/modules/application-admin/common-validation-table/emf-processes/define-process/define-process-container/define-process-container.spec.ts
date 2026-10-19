import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { DefineProcessContainerComponent } from './define-process-container';
import { DefineProcessService } from '../../services/define-process.service';
import { ManufLookupService } from '../../services/manuf-lookup.service';
import { EmfProcessesService } from '../../services/emf-processes.service';
import { HeaderService } from '@shared/services/header.service';
import { SourceProcess, TargetProcessDto } from '../../interfaces/source-process.interface';
import { ProcessStepFormData } from '../process-step-form/process-step-form';

describe('DefineProcessContainerComponent', () => {
  let component: DefineProcessContainerComponent;
  let fixture: ComponentFixture<DefineProcessContainerComponent>;

  let queryParams$: BehaviorSubject<Record<string, string>>;
  let mockRoute: { queryParams: ReturnType<BehaviorSubject<Record<string, string>>['asObservable']> };
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDefineProcessService: jasmine.SpyObj<DefineProcessService>;
  let mockManufLookupService: jasmine.SpyObj<ManufLookupService>;
  let mockEmfProcessesService: jasmine.SpyObj<EmfProcessesService>;
  let mockHeaderService: { chapterTimeZone: jasmine.Spy };

  // ---------- shared mock data ----------

  const mockSourceData: SourceProcess[] = [
    {
      processCode: 'TEST_PROC', processSeq: 1, lookingFor: 'BLOOD_TYPE',
      dataTableName: 'T1', dataColumnName: 'C1', response: '', sqlOper: '',
      paramFlag: 'Y', auditKey: 100, insertDate: '2025-01-08', insertUser: 'admin'
    },
    {
      processCode: 'TEST_PROC', processSeq: 1.01, lookingFor: 'BLOOD_TYPE',
      dataTableName: 'DONOR_INFO', dataColumnName: 'BLOOD_CD', response: 'A+',
      sqlOper: 'EQUALS', auditKey: 101, insertDate: '2025-01-08', insertUser: 'admin'
    }
  ];

  const mockTargetData: TargetProcessDto[] = [
    {
      processCode: 'TEST_PROC', actionSeq: '1', actionCode: 'INSERT',
      actionOn: 'DONOR', actionValue: 'Y', actionFncs: 'F1',
      insertDate: '2025-01-08', insertUser: 'admin', auditKey: 200
    }
  ];

  const mockMappingLookups = [
    { mappingName: 'BLOOD_TYPE', dataTableName: 'DONOR_INFO', dataColumnName: 'BLOOD_CD' }
  ];

  const mockOperators = ['EQUALS', 'AND', 'OR'];
  const mockActionCodes = ['INSERT', 'UPDATE', 'DELETE'];

  // ---------- helpers ----------

  function setDefaultServiceReturns(): void {
    mockDefineProcessService.getSourceProcesses.and.returnValue(
      of({ data: mockSourceData, totalRecords: 2 })
    );
    mockDefineProcessService.getTargetProcessesBySource.and.returnValue(
      of({ data: mockTargetData, totalRecords: 1 })
    );
    mockManufLookupService.getMappingLookups.and.returnValue(of(mockMappingLookups));
    mockManufLookupService.getOperators.and.returnValue(of(mockOperators));
    mockManufLookupService.getActionCodes.and.returnValue(of(mockActionCodes));
    mockEmfProcessesService.getProcessCodeById.and.returnValue(
      of({ procCode: 'TEST_PROC', procDesc: 'Test', effDate: '2025-01-01' })
    );
  }

  /** Trigger ngOnInit and flush the forkJoin / subscriptions */
  function initAndTick(): void {
    fixture.detectChanges(); // triggers ngOnInit
    tick();                  // flush async subscriptions
  }

  // ---------- TestBed ----------

  beforeEach(async () => {
    queryParams$ = new BehaviorSubject<Record<string, string>>({ code: 'TEST_PROC', id: '1' });

    mockRoute = { queryParams: queryParams$.asObservable() };
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    mockDefineProcessService = jasmine.createSpyObj('DefineProcessService', [
      'getSourceProcesses', 'getSourceProcessById', 'getSourceProcessWithDetails',
      'createSourceProcess', 'updateSourceProcess', 'deleteSourceProcess',
      'getTargetProcesses', 'getTargetProcessesBySource', 'getTargetProcessById',
      'createTargetProcess', 'updateTargetProcess', 'deleteTargetProcess',
      'getNextTargetSequence', 'generateSql', 'viewSql'
    ]);

    mockManufLookupService = jasmine.createSpyObj('ManufLookupService', [
      'getMappingLookups', 'getOperators', 'getActionCodes'
    ]);

    mockEmfProcessesService = jasmine.createSpyObj('EmfProcessesService', ['getProcessCodeById']);
    mockHeaderService = { chapterTimeZone: jasmine.createSpy('chapterTimeZone').and.returnValue('+00:00') };

    setDefaultServiceReturns();

    await TestBed.configureTestingModule({
      imports: [DefineProcessContainerComponent, BrowserAnimationsModule],
      providers: [
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: DefineProcessService, useValue: mockDefineProcessService },
        { provide: ManufLookupService, useValue: mockManufLookupService },
        { provide: EmfProcessesService, useValue: mockEmfProcessesService },
        { provide: HeaderService, useValue: mockHeaderService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .overrideComponent(DefineProcessContainerComponent, {
        set: { imports: [], template: '<div></div>' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(DefineProcessContainerComponent);
    component = fixture.componentInstance;
  });

  // ==================== Initialization ====================

  describe('Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should read processCode and processId from route queryParams', fakeAsync(() => {
      initAndTick();

      expect(component.processCode).toBe('TEST_PROC');
      expect(component.processId).toBe('1');
    }));

    it('should call loadData and checkTerminatedStatus when processCode exists', fakeAsync(() => {
      initAndTick();

      // loadData calls forkJoin of 5 services
      expect(mockDefineProcessService.getSourceProcesses).toHaveBeenCalled();
      expect(mockDefineProcessService.getTargetProcessesBySource).toHaveBeenCalled();
      expect(mockManufLookupService.getMappingLookups).toHaveBeenCalled();
      expect(mockManufLookupService.getOperators).toHaveBeenCalled();
      expect(mockManufLookupService.getActionCodes).toHaveBeenCalled();

      // checkTerminatedStatus
      expect(mockEmfProcessesService.getProcessCodeById).toHaveBeenCalledWith('TEST_PROC');
    }));

    it('should not call loadData when processCode is empty', fakeAsync(() => {
      queryParams$.next({ code: '', id: '' });
      initAndTick();

      expect(mockDefineProcessService.getSourceProcesses).not.toHaveBeenCalled();
      expect(mockEmfProcessesService.getProcessCodeById).not.toHaveBeenCalled();
    }));
  });

  // ==================== loadData ====================

  describe('loadData', () => {
    it('should call forkJoin with 5 service calls', fakeAsync(() => {
      initAndTick();

      expect(mockDefineProcessService.getSourceProcesses).toHaveBeenCalledWith(
        1000, 0, { processCode: 'TEST_PROC' }
      );
      expect(mockDefineProcessService.getTargetProcessesBySource).toHaveBeenCalledWith('TEST_PROC');
      expect(mockManufLookupService.getMappingLookups).toHaveBeenCalledWith('TEST_PROC');
      expect(mockManufLookupService.getOperators).toHaveBeenCalled();
      expect(mockManufLookupService.getActionCodes).toHaveBeenCalled();
    }));

    it('should filter sourceProcesses by exact processCode (case-insensitive)', fakeAsync(() => {
      const mixedData: SourceProcess[] = [
        ...mockSourceData,
        {
          processCode: 'TEST_PROC_OTHER', processSeq: 1, lookingFor: 'PARTIAL',
          auditKey: 999, insertDate: '2025-01-01', insertUser: 'admin'
        }
      ];
      mockDefineProcessService.getSourceProcesses.and.returnValue(
        of({ data: mixedData, totalRecords: 3 })
      );

      initAndTick();

      // The partial match 'TEST_PROC_OTHER' should be excluded; only 1 main step from TEST_PROC
      expect(component.processSteps.length).toBe(1);
      expect(component.processSteps[0].name).toBe('BLOOD_TYPE');
    }));

    it('should set isLoading false on finalize', fakeAsync(() => {
      initAndTick();

      expect(component.isLoading).toBeFalse();
    }));

    it('should show error notification on failure', fakeAsync(() => {
      mockDefineProcessService.getSourceProcesses.and.returnValue(throwError(() => new Error('fail')));

      initAndTick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Failed to load process data',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
      expect(component.processSteps).toEqual([]);
      expect(component.reflexiveActions).toEqual([]);
    }));

    it('should build processSteps and reflexiveActions from data', fakeAsync(() => {
      initAndTick();

      expect(component.processSteps.length).toBe(1);
      expect(component.processSteps[0].name).toBe('BLOOD_TYPE');
      expect(component.processSteps[0].sequence).toBe('1.00');

      expect(component.reflexiveActions.length).toBe(1);
      expect(component.reflexiveActions[0].name).toBe('INSERT');
      expect(component.reflexiveActions[0].code).toBe('1');
    }));
  });

  // ==================== mapSourceProcessesToSteps ====================

  describe('mapSourceProcessesToSteps', () => {
    it('should separate main steps (integer seq) from sub-conditions (decimal seq)', fakeAsync(() => {
      initAndTick();

      // processSeq 1 = main step, 1.01 = sub-condition
      const step = component.processSteps[0];
      expect(step.id).toBe('1');
      expect(step.conditions.length).toBe(1);
      expect(step.conditions[0].sequence).toBe('1.01');
    }));

    it('should auto-select first step', fakeAsync(() => {
      initAndTick();

      expect(component.selectedStepId).toBe('1');
      expect(component.selectedStepData).not.toBeNull();
    }));

    it('should handle empty records', fakeAsync(() => {
      mockDefineProcessService.getSourceProcesses.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      initAndTick();

      expect(component.processSteps).toEqual([]);
      expect(component.selectedStepId).toBeNull();
    }));
  });

  // ==================== mapTargetProcessesToActions ====================

  describe('mapTargetProcessesToActions', () => {
    it('should map TargetProcessDto to ReflexiveAction', fakeAsync(() => {
      initAndTick();

      const action = component.reflexiveActions[0];
      expect(action.id).toBe('1');
      expect(action.code).toBe('1');
      expect(action.name).toBe('INSERT');
      expect(action.actionOn).toBe('DONOR');
      expect(action.actionValue).toBe('Y');
      expect(action.badge).toBe('F1');
    }));

    it('should auto-select first action', fakeAsync(() => {
      initAndTick();

      expect(component.selectedActionId).toBe('1');
      expect(component.selectedActionData).not.toBeNull();
    }));
  });

  // ==================== onStepSelect ====================

  describe('onStepSelect', () => {
    it('should set selectedStepId and selectedStepData', fakeAsync(() => {
      initAndTick();

      const step = component.processSteps[0];
      component.onStepSelect(step);

      expect(component.selectedStepId).toBe(step.id);
      expect(component.selectedStepData).not.toBeNull();
      expect(component.selectedStepData!.stepName).toBe('BLOOD_TYPE');
    }));

    it('should build conditions from sub-condition records', fakeAsync(() => {
      initAndTick();

      const step = component.processSteps[0];
      component.onStepSelect(step);

      expect(component.selectedStepData!.conditions.length).toBe(1);
      expect(component.selectedStepData!.conditions[0].operator).toBe('EQUALS');
      expect(component.selectedStepData!.conditions[0].response).toBe('A+');
      expect(component.selectedStepData!.conditions[0].dataEntity).toBe('DONOR_INFO');
      expect(component.selectedStepData!.conditions[0].dataSource).toBe('BLOOD_CD');
    }));

    it('should create default condition when no sub-conditions', fakeAsync(() => {
      // Provide a main step with no sub-conditions
      const soloStep: SourceProcess[] = [
        {
          processCode: 'TEST_PROC', processSeq: 2, lookingFor: 'WEIGHT',
          auditKey: 300, insertDate: '2025-01-08', insertUser: 'admin'
        }
      ];
      mockDefineProcessService.getSourceProcesses.and.returnValue(
        of({ data: soloStep, totalRecords: 1 })
      );

      initAndTick();

      const step = component.processSteps[0];
      component.onStepSelect(step);

      expect(component.selectedStepData!.conditions.length).toBe(1);
      expect(component.selectedStepData!.conditions[0].operator).toBe('');
      expect(component.selectedStepData!.conditions[0].response).toBe('');
    }));
  });

  // ==================== onAddNewStep ====================

  describe('onAddNewStep', () => {
    it('should open AddStepDialog with correct data', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      mockDialog.open.and.returnValue(dialogRefSpy);

      initAndTick();
      component.onAddNewStep();

      expect(mockDialog.open).toHaveBeenCalledWith(
        jasmine.any(Function),
        jasmine.objectContaining({
          width: '432px',
          disableClose: true,
          data: jasmine.objectContaining({
            existingStepNames: ['BLOOD_TYPE'],
            processCode: 'TEST_PROC'
          })
        })
      );
    }));

    it('should call createNewStep on dialog close with result', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ name: 'NEW_STEP' }));
      mockDialog.open.and.returnValue(dialogRefSpy);
      mockDefineProcessService.createSourceProcess.and.returnValue(of({}));

      initAndTick();
      component.onAddNewStep();
      tick();

      expect(mockDefineProcessService.createSourceProcess).toHaveBeenCalledWith(
        jasmine.objectContaining({
          processCode: 'TEST_PROC',
          processSeq: 2,
          lookingFor: 'NEW_STEP',
          paramFlag: 'Y'
        })
      );
    }));

    it('should do nothing when dialog is cancelled', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      mockDialog.open.and.returnValue(dialogRefSpy);

      initAndTick();
      component.onAddNewStep();
      tick();

      expect(mockDefineProcessService.createSourceProcess).not.toHaveBeenCalled();
    }));
  });

  // ==================== onSaveStep ====================

  describe('onSaveStep', () => {
    it('should create operations for new conditions and update existing ones', fakeAsync(() => {
      mockDefineProcessService.updateSourceProcess.and.returnValue(of({}));

      initAndTick();

      const formData: ProcessStepFormData = {
        stepName: 'BLOOD_TYPE',
        stepSequence: '1.00',
        conditions: [
          {
            lookingFor: 'BLOOD_TYPE', dataEntity: 'DONOR_INFO',
            dataSource: 'BLOOD_CD', operator: 'EQUALS', response: 'B+', isExisting: true
          }
        ]
      };

      component.onSaveStep(formData);
      tick();

      expect(mockDefineProcessService.updateSourceProcess).toHaveBeenCalled();
    }));

    it('should show success notification and reload data', fakeAsync(() => {
      mockDefineProcessService.updateSourceProcess.and.returnValue(of({}));

      initAndTick();

      // Reset call counts after initial load
      mockDefineProcessService.getSourceProcesses.calls.reset();

      const formData: ProcessStepFormData = {
        stepName: 'BLOOD_TYPE',
        stepSequence: '1.00',
        conditions: [
          {
            lookingFor: 'BLOOD_TYPE', dataEntity: 'DONOR_INFO',
            dataSource: 'BLOOD_CD', operator: 'EQUALS', response: 'B+', isExisting: true
          }
        ]
      };

      component.onSaveStep(formData);
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('updated successfully'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
      // Should reload data after save
      expect(mockDefineProcessService.getSourceProcesses).toHaveBeenCalled();
    }));

    it('should show error notification on failure', fakeAsync(() => {
      mockDefineProcessService.updateSourceProcess.and.returnValue(
        throwError(() => ({ error: { message: 'Save failed' } }))
      );

      initAndTick();

      const formData: ProcessStepFormData = {
        stepName: 'BLOOD_TYPE',
        stepSequence: '1.00',
        conditions: [
          {
            lookingFor: 'BLOOD_TYPE', dataEntity: 'DONOR_INFO',
            dataSource: 'BLOOD_CD', operator: 'EQUALS', response: 'B+', isExisting: true
          }
        ]
      };

      component.onSaveStep(formData);
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Save failed',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should return early when no operations are needed', fakeAsync(() => {
      initAndTick();

      // stepName unchanged, same conditions - no operations
      const formData: ProcessStepFormData = {
        stepName: 'BLOOD_TYPE',
        stepSequence: '1.00',
        conditions: []
      };

      // Calling with no selectedStepId
      component.selectedStepId = null;
      component.onSaveStep(formData);
      tick();

      expect(mockDefineProcessService.updateSourceProcess).not.toHaveBeenCalled();
      expect(mockDefineProcessService.createSourceProcess).not.toHaveBeenCalled();
    }));
  });

  // ==================== onSaveAction ====================

  describe('onSaveAction', () => {
    const actionData = {
      group: '2', action: 'UPDATE', tableName: 'T2', actionOn: 'UNIT',
      columnName: 'C2', actionValue: 'N', processOrder: '1',
      alternateProcessOrder: '2', parentGroup: '', operator: 'EQUALS',
      response: 'YES', functions: 'F2'
    };

    it('should create target process when selectedActionId is null', fakeAsync(() => {
      mockDefineProcessService.createTargetProcess.and.returnValue(of({}));

      initAndTick();

      component.selectedActionId = null;
      component.onSaveAction(actionData);
      tick();

      expect(mockDefineProcessService.createTargetProcess).toHaveBeenCalledWith(
        jasmine.objectContaining({
          processCode: 'TEST_PROC',
          actionSeq: '2',
          actionCode: 'UPDATE'
        })
      );
    }));

    it('should update target process when selectedActionId exists', fakeAsync(() => {
      mockDefineProcessService.updateTargetProcess.and.returnValue(of({}));

      initAndTick();

      // selectedActionId is auto-set to '1' after load
      expect(component.selectedActionId).toBe('1');

      component.onSaveAction(actionData);
      tick();

      expect(mockDefineProcessService.updateTargetProcess).toHaveBeenCalledWith(
        'TEST_PROC',
        '1', // actionSeq from targetProcessRecords[0]
        jasmine.objectContaining({
          actionCode: 'UPDATE',
          auditKey: 200
        })
      );
    }));

    it('should show notification on success and error', fakeAsync(() => {
      // Test success path
      mockDefineProcessService.createTargetProcess.and.returnValue(of({}));

      initAndTick();

      component.selectedActionId = null;
      component.onSaveAction(actionData);
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('created successfully'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );

      // Test error path
      mockDefineProcessService.createTargetProcess.and.returnValue(
        throwError(() => ({ error: { message: 'Create failed' } }))
      );

      component.selectedActionId = null;
      component.onSaveAction(actionData);
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Create failed',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));
  });

  // ==================== SQL operations ====================

  describe('SQL operations', () => {
    it('should generate SQL and show success notification', fakeAsync(() => {
      mockDefineProcessService.generateSql.and.returnValue(of({ success: true }));
      // loadDataAndOpenViewSql will call loadData again; viewSql called afterwards
      mockDefineProcessService.viewSql.and.returnValue(of([]));

      initAndTick();

      component.onGenerateSql();
      tick();

      expect(mockDefineProcessService.generateSql).toHaveBeenCalledWith('TEST_PROC');
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'SQL generated successfully.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    }));

    it('should show error on generate SQL failure', fakeAsync(() => {
      mockDefineProcessService.generateSql.and.returnValue(
        throwError(() => ({ error: { message: 'SQL generation error' } }))
      );

      initAndTick();

      component.onGenerateSql();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'SQL generation error',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should open ViewSqlDialog when SQL statements exist', fakeAsync(() => {
      const sqlStatements = [
        { processCode: 'TEST_PROC', processSeq: 1, lookingFor: 'BLOOD_TYPE', sqlStmt: 'SELECT 1' }
      ];
      mockDefineProcessService.viewSql.and.returnValue(of(sqlStatements));

      initAndTick();

      component.onViewSql();
      tick();

      expect(mockDialog.open).toHaveBeenCalledWith(
        jasmine.any(Function),
        jasmine.objectContaining({
          data: jasmine.objectContaining({
            processCode: 'TEST_PROC',
            sqlStatements
          })
        })
      );
    }));

    it('should show notification when no SQL statements found', fakeAsync(() => {
      mockDefineProcessService.viewSql.and.returnValue(of([]));

      initAndTick();

      component.onViewSql();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'No SQL statements found. Generate SQL first.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));
  });

  // ==================== checkTerminatedStatus ====================

  describe('checkTerminatedStatus', () => {
    it('should show warning when termDate is in the past', fakeAsync(() => {
      mockEmfProcessesService.getProcessCodeById.and.returnValue(of({
        procCode: 'TEST_PROC', procDesc: 'Test', effDate: '2025-01-01',
        termDate: '2020-06-15'
      }));

      initAndTick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('terminated'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should not show warning when no termDate', fakeAsync(() => {
      mockEmfProcessesService.getProcessCodeById.and.returnValue(of({
        procCode: 'TEST_PROC', procDesc: 'Test', effDate: '2025-01-01'
      }));

      initAndTick();

      // The only snackBar calls should not include 'terminated'
      const terminatedCalls = mockSnackBar.open.calls.allArgs().filter(
        args => typeof args[0] === 'string' && args[0].includes('terminated')
      );
      expect(terminatedCalls.length).toBe(0);
    }));

    it('should only show terminated warning once across multiple queryParam emissions', fakeAsync(() => {
      mockEmfProcessesService.getProcessCodeById.and.returnValue(of({
        procCode: 'TEST_PROC', procDesc: 'Test', effDate: '2025-01-01',
        termDate: '2020-06-15'
      }));

      initAndTick();

      const terminatedCallsBefore = mockSnackBar.open.calls.allArgs().filter(
        args => typeof args[0] === 'string' && args[0].includes('terminated')
      ).length;

      // Emit same params again - should not show warning a second time
      queryParams$.next({ code: 'TEST_PROC', id: '1' });
      tick();

      const terminatedCallsAfter = mockSnackBar.open.calls.allArgs().filter(
        args => typeof args[0] === 'string' && args[0].includes('terminated')
      ).length;
      expect(terminatedCallsAfter).toBe(terminatedCallsBefore);
    }));
  });

  // ==================== Miscellaneous ====================

  describe('Miscellaneous', () => {
    it('should update activeTab on onTabChange', fakeAsync(() => {
      initAndTick();

      expect(component.activeTab).toBe('process-steps');

      component.onTabChange('reflexive-actions');

      expect(component.activeTab).toBe('reflexive-actions');
    }));

    it('should navigate to root on onClose', fakeAsync(() => {
      initAndTick();

      component.onClose();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    }));
  });
});
