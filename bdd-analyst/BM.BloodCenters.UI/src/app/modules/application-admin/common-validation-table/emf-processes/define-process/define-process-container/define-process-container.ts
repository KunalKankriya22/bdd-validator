import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil, finalize, forkJoin } from 'rxjs';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { ProcessStepsListComponent, ProcessStep } from '../process-steps-list/process-steps-list';
import { ProcessStepFormComponent, ProcessStepFormData } from '../process-step-form/process-step-form';
import { AddStepDialog } from '../add-step-dialog/add-step-dialog';
import { ReflexiveActionsListComponent, ReflexiveAction } from '../reflexive-actions-list/reflexive-actions-list';
import { ReflexiveActionDetailsComponent, ReflexiveActionDetailsData } from '../reflexive-action-details/reflexive-action-details';
import { ReflexiveActionVisualFlowComponent } from '../reflexive-action-visual-flow/reflexive-action-visual-flow';
import { SqlStatementDialogComponent, SqlStatementDialogData } from '../sql-statement-dialog/sql-statement-dialog';
import { ViewSqlDialogComponent, ViewSqlDialogData } from '../view-sql-dialog/view-sql-dialog';
import { DefineProcessService } from '../../services/define-process.service';
import { ManufLookupService, MappingNameLookupDto } from '../../services/manuf-lookup.service';
import { EmfProcessesService } from '../../services/emf-processes.service';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import moment from 'moment';
import {
  SourceProcess,
  CreateSourceProcessRequestDto,
  UpdateSourceProcessRequestDto,
  TargetProcessDto,
  CreateTargetProcessRequestDto,
  UpdateTargetProcessRequestDto
} from '../../interfaces/source-process.interface';

@Component({
  selector: 'app-define-process-container',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    ProcessStepsListComponent,
    ProcessStepFormComponent,
    ReflexiveActionsListComponent,
    ReflexiveActionDetailsComponent,
    ReflexiveActionVisualFlowComponent,
    SqlStatementDialogComponent,
    ViewSqlDialogComponent
  ],
  templateUrl: './define-process-container.html',
  styleUrls: ['./define-process-container.scss']
})
export class DefineProcessContainerComponent implements OnInit, OnDestroy {
  processCode: string = '';
  processId: string = '';
  lastModifiedDate: string = '';

  isLoading = false;
  isSavingAction = false;
  isGeneratingSql = false;
  isLoadingSql = false;

  private destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'EMF Processes', link: '/application-administration/common-validation/emf-processes' }
    ],
    title: '',
    subtitle: '',
    actions: []
  };

  activeTab = 'process-steps';
  processSteps: ProcessStep[] = [];
  selectedStepId: string | null = null;
  selectedStepData: ProcessStepFormData | null = null;

  // Reflexive Actions properties
  reflexiveActions: ReflexiveAction[] = [];
  selectedActionId: string | null = null;
  selectedActionData: ReflexiveActionDetailsData | null = null;
  activeActionTab = 'details';

  // Raw API data for tracking auditKeys and sequences
  private sourceProcessRecords: SourceProcess[] = [];
  private targetProcessRecords: TargetProcessDto[] = [];
  // Available "Looking For" options from process mappings
  private lookingForStepOptions: Array<{ id: string; name: string }> = [];
  // Full mapping lookup data for auto-populating Data Entity/Data Source
  mappingLookups: MappingNameLookupDto[] = [];
  // Operator options from API
  operatorOptions: string[] = [];
  // Action code options from API
  actionCodeOptions: string[] = [];
  isSavingStep = false;
  private terminatedWarningShown = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private defineProcessService: DefineProcessService,
    private manufLookupService: ManufLookupService,
    private emfProcessesService: EmfProcessesService,
    private headerService: HeaderService,
  ) {}

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.processCode = params['code'] || '';
        this.processId = params['id'] || '';
        if (this.processCode) {
          this.updateHeaderConfig();
          this.loadData();
          this.checkTerminatedStatus();
        }
      });
  }

  private updateHeaderConfig(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'EMF Processes', link: '/application-administration/common-validation/emf-processes' },
        { label: `Define Process-${this.processCode}`, link: null }
      ],
      title: `Define Process-${this.processCode}`,
      subtitle: '',
      metadata: this.lastModifiedDate ? `Last Modified ${this.lastModifiedDate}` : '',
      actions: [
        {
          label: 'VIEW SQL',
          variant: 'outlined',
          disabled: this.isLoadingSql,
          onClick: () => this.onViewSql()
        },
        {
          label: 'GENERATE SQL',
          variant: 'filled',
          disabled: this.isGeneratingSql,
          onClick: () => this.onGenerateSql()
        }
      ]
    };
  }

  onGenerateSql(): void {
    if (!this.processCode) return;

    this.isGeneratingSql = true;
    this.updateHeaderConfig();
    this.defineProcessService.generateSql(this.processCode)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isGeneratingSql = false;
          this.updateHeaderConfig();
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showNotification('SQL generated successfully.', false);
            // Oracle Forms behavior: Reload all data to get generated SQL_STMT values
            // Wait for data to load, then open View SQL dialog
            this.loadDataAndOpenViewSql();
          } else {
            this.showNotification('Failed to generate SQL.', true);
          }
        },
        error: (err) => {
          const message = err?.error?.message || 'Failed to generate SQL';
          this.showNotification(message, true);
        }
      });
  }

  onViewSql(): void {
    if (!this.processCode) return;

    this.isLoadingSql = true;
    this.updateHeaderConfig();
    this.defineProcessService.viewSql(this.processCode)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingSql = false;
          this.updateHeaderConfig();
        })
      )
      .subscribe({
        next: (sqlStatements) => {
          // Oracle Forms behavior: Show message if no SQL statements found
          if (!sqlStatements || sqlStatements.length === 0) {
            this.showNotification('No SQL statements found. Generate SQL first.', true);
            return;
          }

          // Open dialog with SQL statements
          const dialogData: ViewSqlDialogData = {
            processCode: this.processCode,
            sqlStatements
          };

          this.dialog.open(ViewSqlDialogComponent, {
            data: dialogData,
            panelClass: 'view-sql-dialog-container',
            disableClose: false,
            maxWidth: '95vw',
            maxHeight: '90vh'
          });
        },
        error: (err) => {
          const message = err?.error?.message || 'Failed to load SQL statements';
          this.showNotification(message, true);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.isLoading = true;

    forkJoin({
      sourceProcesses: this.defineProcessService.getSourceProcesses(1000, 0, {
        processCode: this.processCode
      }),
      targetProcesses: this.defineProcessService.getTargetProcessesBySource(this.processCode),
      mappingLookups: this.manufLookupService.getMappingLookups(this.processCode),
      operators: this.manufLookupService.getOperators(),
      actionCodes: this.manufLookupService.getActionCodes()
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: ({ sourceProcesses, targetProcesses, mappingLookups, operators, actionCodes }) => {
          // Filter to exact processCode match (API LIKE filter may return partial matches)
          this.sourceProcessRecords = sourceProcesses.data.filter(
            r => r.processCode.toUpperCase() === this.processCode.toUpperCase()
          );
          this.targetProcessRecords = targetProcesses.data;

          this.mapSourceProcessesToSteps(this.sourceProcessRecords);
          this.mapTargetProcessesToActions(targetProcesses.data);
          this.mappingLookups = mappingLookups;
          this.buildLookingForOptions(mappingLookups.map(m => m.mappingName));

          // Map operator codes from API
          this.operatorOptions = operators;
          this.actionCodeOptions = actionCodes;

          // Extract last modified date from records
          this.extractLastModifiedDate();
          this.updateHeaderConfig();

        },
        error: () => {
          this.processSteps = [];
          this.reflexiveActions = [];
          this.showNotification('Failed to load process data', true);
        }
      });
  }

  private loadDataAndOpenViewSql(): void {
    this.isLoading = true;

    forkJoin({
      sourceProcesses: this.defineProcessService.getSourceProcesses(1000, 0, {
        processCode: this.processCode
      }),
      targetProcesses: this.defineProcessService.getTargetProcessesBySource(this.processCode),
      mappingLookups: this.manufLookupService.getMappingLookups(this.processCode),
      operators: this.manufLookupService.getOperators(),
      actionCodes: this.manufLookupService.getActionCodes()
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: ({ sourceProcesses, targetProcesses, mappingLookups, operators, actionCodes }) => {
          // Filter to exact processCode match (API LIKE filter may return partial matches)
          this.sourceProcessRecords = sourceProcesses.data.filter(
            r => r.processCode.toUpperCase() === this.processCode.toUpperCase()
          );
          this.targetProcessRecords = targetProcesses.data;

          this.mapSourceProcessesToSteps(this.sourceProcessRecords);
          this.mapTargetProcessesToActions(targetProcesses.data);
          this.mappingLookups = mappingLookups;
          this.buildLookingForOptions(mappingLookups.map(m => m.mappingName));

          // Map operator codes from API
          this.operatorOptions = operators;
          this.actionCodeOptions = actionCodes;

          // After data is loaded, open View SQL dialog
          this.onViewSql();
        },
        error: () => {
          this.processSteps = [];
          this.reflexiveActions = [];
          this.showNotification('Failed to load process data', true);
        }
      });
  }

  private mapSourceProcessesToSteps(records: SourceProcess[]): void {
    // Separate main steps (integer processSeq) from sub-conditions (decimal processSeq)
    const mainSteps = records.filter(r => r.processSeq === Math.floor(r.processSeq));
    const subConditions = records.filter(r => r.processSeq !== Math.floor(r.processSeq));

    this.processSteps = mainSteps
      .sort((a, b) => a.processSeq - b.processSeq)
      .map(step => {
        const baseSeq = Math.floor(step.processSeq);
        // Find sub-conditions for this main step
        const conditions = subConditions
          .filter(c => Math.floor(c.processSeq) === baseSeq)
          .sort((a, b) => a.processSeq - b.processSeq)
          .map(c => {
            const seqLabel = c.processSeq.toFixed(2);
            const detailParts: string[] = [];
            if (c.dataTableName) detailParts.push(c.dataTableName);
            if (c.dataColumnName) detailParts.push(c.dataColumnName);
            if (c.sqlOper) detailParts.push(c.sqlOper);
            if (c.response) detailParts.push(c.response);
            const detail = detailParts.join(', ');
            const description = c.lookingFor
              ? (detail ? `${c.lookingFor} | ${detail}` : c.lookingFor)
              : detail;

            return {
              id: seqLabel,
              sequence: seqLabel,
              description
            };
          })
          .filter(c => c.description);

        return {
          id: baseSeq.toString(),
          sequence: `${baseSeq}.00`,
          name: step.lookingFor || '',
          conditions
        };
      });

    if (this.processSteps.length > 0) {
      this.onStepSelect(this.processSteps[0]);
    }
  }

  private mapTargetProcessesToActions(records: TargetProcessDto[]): void {
    this.reflexiveActions = records
      .sort((a, b) => a.actionSeq.localeCompare(b.actionSeq))
      .map((tp, index) => ({
        id: (index + 1).toString(),
        code: tp.actionSeq,
        name: tp.actionCode,
        actionOn: tp.actionOn || '',
        actionValue: tp.actionValue || '',
        badge: tp.actionFncs || undefined,
        linkedAction: undefined
      }));

    if (this.reflexiveActions.length > 0) {
      this.onActionSelect(this.reflexiveActions[0]);
    }
  }

  private buildLookingForOptions(mappingNames: string[]): void {
    this.lookingForStepOptions = mappingNames.map((name, index) => ({
      id: (index + 1).toString(),
      name
    }));
  }

  private extractLastModifiedDate(): void {
    const allRecords = [
      ...this.sourceProcessRecords.map(r => ({ date: r.insertDate, user: r.insertUser })),
      ...this.targetProcessRecords.map(r => ({ date: r.insertDate, user: r.insertUser }))
    ];

    if (allRecords.length === 0) {
      this.lastModifiedDate = '';
      return;
    }

    // Find the most recent date
    const sortedRecords = allRecords.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    const mostRecent = sortedRecords[0];
    if (mostRecent && mostRecent.date) {
      const date = new Date(mostRecent.date);
      // Format as: 08-JAN-2025 11:12 PST
      const day = String(date.getDate()).padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      // Get timezone abbreviation
      const tzAbbr = new Date().toLocaleTimeString('en-us', { timeZoneName: 'short' }).split(' ')[2];

      this.lastModifiedDate = `${day}-${month}-${year} ${hours}:${minutes} ${tzAbbr}`;
    } else {
      this.lastModifiedDate = '';
    }
  }

  onTabChange(tabId: string): void {
    this.activeTab = tabId;
  }

  onStepSelect(step: ProcessStep): void {
    this.selectedStepId = step.id;
    const baseSeq = parseInt(step.id, 10);

    // Get the parent step record to use its lookingFor as fallback
    const parentRecord = this.sourceProcessRecords.find(
      r => r.processSeq === baseSeq
    );
    const parentLookingFor = parentRecord?.lookingFor || '';

    // Get sub-condition records for this step from raw API data
    const subConditions = this.sourceProcessRecords
      .filter(r =>
        Math.floor(r.processSeq) === baseSeq &&
        r.processSeq !== Math.floor(r.processSeq)
      )
      .sort((a, b) => a.processSeq - b.processSeq);

    this.selectedStepData = {
      stepName: step.name,
      stepSequence: step.sequence,
      conditions: subConditions.length > 0
        ? subConditions.map(c => {
            const lookingFor = c.lookingFor || parentLookingFor;
            const mapping = this.mappingLookups.find(m => m.mappingName === lookingFor);
            return {
              lookingFor,
              dataEntity: c.dataTableName || mapping?.dataTableName || '',
              dataSource: c.dataColumnName || mapping?.dataColumnName || '',
              operator: c.sqlOper || '',
              response: c.response || '',
              isExisting: true
            };
          })
        : (() => {
            const mapping = this.mappingLookups.find(m => m.mappingName === parentLookingFor);
            return [{
              lookingFor: parentLookingFor,
              dataEntity: mapping?.dataTableName || '',
              dataSource: mapping?.dataColumnName || '',
              operator: '',
              response: ''
            }];
          })()
    };
  }

  onAddNewStep(): void {
    // Get existing step names for duplicate validation
    const existingStepNames = this.processSteps.map(s => s.name);

    const dialogRef = this.dialog.open(AddStepDialog, {
      width: '432px',
      panelClass: 'add-step-dialog-container',
      disableClose: true,
      data: {
        steps: this.lookingForStepOptions,
        existingStepNames,
        processCode: this.processCode
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createNewStep(result.name);
      }
    });
  }

  private createNewStep(stepName: string): void {
    // Calculate next integer sequence
    const maxSeq = this.processSteps.length > 0
      ? Math.max(...this.processSteps.map(s => parseInt(s.id, 10)))
      : 0;
    const newSeq = maxSeq + 1;

    const createDto: CreateSourceProcessRequestDto = {
      processCode: this.processCode,
      processSeq: newSeq,
      lookingFor: stepName,
      paramFlag: 'Y'
    };

    this.defineProcessService.createSourceProcess(createDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showNotification(`"${stepName}" added successfully.`, false);
          // Reload data to get fresh state
          this.loadData();
        },
        error: (err) => {
          const message = err?.error?.message || 'Failed to add new step';
          this.showNotification(message, true);
        }
      });
  }

  onSaveStep(data: ProcessStepFormData): void {
    if (!this.selectedStepId) return;

    const baseSeq = parseInt(this.selectedStepId, 10);

    // Get existing sub-condition records for this step
    const existingConditions = this.sourceProcessRecords
      .filter(r =>
        Math.floor(r.processSeq) === baseSeq &&
        r.processSeq !== Math.floor(r.processSeq)
      )
      .sort((a, b) => a.processSeq - b.processSeq);

    // Determine which conditions to create vs update vs delete
    const operations: Array<() => import('rxjs').Observable<any>> = [];

    // Update the main step's lookingFor if the name changed
    const mainStepRecord = this.sourceProcessRecords.find(
      r => r.processSeq === baseSeq
    );
    if (mainStepRecord && mainStepRecord.lookingFor !== data.stepName) {
      const updateMainDto: UpdateSourceProcessRequestDto = {
        lookingFor: data.stepName,
        dataTableName: mainStepRecord.dataTableName,
        dataColumnName: mainStepRecord.dataColumnName,
        sqlOper: mainStepRecord.sqlOper,
        response: mainStepRecord.response,
        paramFlag: mainStepRecord.paramFlag,
        auditKey: mainStepRecord.auditKey
      };
      operations.push(() =>
        this.defineProcessService.updateSourceProcess(
          this.processCode, baseSeq, updateMainDto
        )
      );
    }

    // Process each condition in the form
    data.conditions.forEach((condition, index) => {
      const subSeq = parseFloat(`${baseSeq}.${(index + 1).toString().padStart(2, '0')}`);
      const existingRecord = existingConditions.find(r => r.processSeq === subSeq);

      if (existingRecord) {
        // Update existing condition
        const updateDto: UpdateSourceProcessRequestDto = {
          lookingFor: condition.lookingFor || undefined,
          dataTableName: condition.dataEntity || undefined,
          dataColumnName: condition.dataSource || undefined,
          sqlOper: condition.operator || undefined,
          response: condition.response || undefined,
          auditKey: existingRecord.auditKey
        };
        operations.push(() =>
          this.defineProcessService.updateSourceProcess(
            this.processCode, subSeq, updateDto
          )
        );
      } else {
        // Create new condition
        const createDto: CreateSourceProcessRequestDto = {
          processCode: this.processCode,
          processSeq: subSeq,
          lookingFor: condition.lookingFor || undefined,
          dataTableName: condition.dataEntity || undefined,
          dataColumnName: condition.dataSource || undefined,
          sqlOper: condition.operator || undefined,
          response: condition.response || undefined
        };
        operations.push(() =>
          this.defineProcessService.createSourceProcess(createDto)
        );
      }
    });

    // Delete conditions that were removed from the form
    existingConditions.forEach(existing => {
      const subIndex = Math.round((existing.processSeq - baseSeq) * 100);
      if (subIndex > data.conditions.length) {
        operations.push(() =>
          this.defineProcessService.deleteSourceProcess(
            this.processCode, existing.processSeq
          )
        );
      }
    });

    if (operations.length === 0) return;

    this.isSavingStep = true;

    // Execute all operations
    forkJoin(operations.map(op => op()))
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isSavingStep = false; })
      )
      .subscribe({
        next: () => {
          const stepName = data.stepName || this.processSteps.find(s => s.id === this.selectedStepId)?.name;
          this.showNotification(`"${stepName}" updated successfully.`, false);
          this.loadData();
        },
        error: (err) => {
          const message = err?.error?.message || 'Failed to save process step';
          this.showNotification(message, true);
        }
      });
  }

  onCancelStep(): void {
    // Re-select current step to reset form
    if (this.selectedStepId) {
      const step = this.processSteps.find(s => s.id === this.selectedStepId);
      if (step) {
        this.onStepSelect(step);
      }
    }
  }

  getSelectedStepSequence(): string {
    if (this.selectedStepId) {
      const step = this.processSteps.find(s => s.id === this.selectedStepId);
      return step?.sequence || '';
    }
    return '';
  }

  onClose(): void {
    this.router.navigate(['/']);
  }


  onActionSelect(action: ReflexiveAction): void {
    this.selectedActionId = action.id;

    // Find the corresponding target process record
    const index = parseInt(action.id, 10) - 1;
    const tp = this.targetProcessRecords[index];

    if (tp) {
      this.selectedActionData = {
        group: tp.actionSeq,
        action: tp.actionCode,
        tableName: tp.dataTableName || '',
        actionOn: tp.actionOn || '',
        columnName: tp.dataColumnName || '',
        actionValue: tp.actionValue || '',
        processOrder: tp.processOrder || '',
        alternateProcessOrder: tp.altProcessOrder || '',
        parentGroup: tp.parentActionSeq || '',
        operator: tp.sqlOper || '',
        response: tp.response || '',
        functions: tp.actionFncs || '',
        processAt: tp.processAt // Preserve processAt for updates
      };
    } else {
      this.selectedActionData = null;
    }
  }

  onAddNewAction(): void {
    this.selectedActionId = null;
    this.selectedActionData = null;
    this.activeActionTab = 'details';
  }

  onSaveAction(data: ReflexiveActionDetailsData): void {
    if (!this.selectedActionId) {
      // Create new target process
      const createDto: CreateTargetProcessRequestDto = {
        processCode: this.processCode,
        actionSeq: data.group,
        actionCode: data.action,
        processAt: data.processAt || undefined,
        actionOn: data.actionOn || undefined,
        actionValue: data.actionValue || undefined,
        dataTableName: data.tableName || undefined,
        dataColumnName: data.columnName || undefined,
        sqlOper: data.operator || undefined,
        response: data.response || undefined,
        processOrder: data.processOrder || undefined,
        altProcessOrder: data.alternateProcessOrder || undefined,
        parentActionSeq: data.parentGroup || undefined,
        actionFncs: data.functions || undefined
      };

      this.isSavingAction = true;
      this.defineProcessService.createTargetProcess(createDto)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isSavingAction = false;
          })
        )
        .subscribe({
          next: () => {
            this.showNotification(`Action "${data.action}" created successfully.`, false);
            this.loadData();
          },
          error: (err) => {
            const message = err?.error?.message || 'Failed to create action';
            this.showNotification(message, true);
          }
        });
      return;
    }

    // Update existing target process
    const index = parseInt(this.selectedActionId, 10) - 1;
    const tp = this.targetProcessRecords[index];
    if (!tp) return;

    const updateDto: UpdateTargetProcessRequestDto = {
      actionSeq: data.group || undefined,
      processAt: data.processAt || undefined,
      actionCode: data.action,
      actionOn: data.actionOn || undefined,
      actionValue: data.actionValue || undefined,
      dataTableName: data.tableName || undefined,
      dataColumnName: data.columnName || undefined,
      sqlOper: data.operator || undefined,
      response: data.response || undefined,
      processOrder: data.processOrder || undefined,
      altProcessOrder: data.alternateProcessOrder || undefined,
      parentActionSeq: data.parentGroup || undefined,
      actionFncs: data.functions || undefined,
      auditKey: tp.auditKey
    };

    this.isSavingAction = true;
    this.defineProcessService.updateTargetProcess(
      this.processCode, tp.actionSeq, updateDto
    )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSavingAction = false;
        })
      )
      .subscribe({
        next: () => {
          this.showNotification(`Action "${data.action}" updated successfully.`, false);
          this.loadData();
        },
        error: (err) => {
          const message = err?.error?.message || 'Failed to update action';
          this.showNotification(message, true);
        }
      });
  }

  onCancelAction(): void {
    // Re-select current action to reset form
    if (this.selectedActionId) {
      const action = this.reflexiveActions.find(a => a.id === this.selectedActionId);
      if (action) {
        this.onActionSelect(action);
      }
    }
  }

  onActionTabChange(tabId: string): void {
    this.activeActionTab = tabId;
  }

  private checkTerminatedStatus(): void {
    if (!this.processCode || this.terminatedWarningShown) return;

    this.emfProcessesService.getProcessCodeById(this.processCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          if (detail?.termDate) {
            const termDate = moment(detail.termDate);
            const today = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
            if (termDate.format('YYYY-MM-DD') < today.format('YYYY-MM-DD')) {
              this.terminatedWarningShown = true;
              this.showNotification(
                `Warning: Process code "${this.processCode}" is terminated (Term Date: ${termDate.format('DD-MMM-YYYY').toUpperCase()}).`,
                true
              );
            }
          }
        }
      });
  }

  private showNotification(message: string, isError: boolean): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: isError ? undefined : 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [isError ? 'error-snackbar' : 'success-snackbar']
    });
  }
}
