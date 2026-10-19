import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ChangeDetectorRef,
  effect,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  RowAction,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';

import { EditTestResultsSidePanelComponent, DropdownOption } from './components/edit-test-results-side-panel.component';
import { EditTestResultsApiService } from './services/edit-test-results-api.service';
import {
  UnitValidationDto,
  UnitTestResultDto,
  EditTestResultFormValue,
  UpdateTestResultDto
} from './models/edit-test-results.model';

import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { ROUTE_REGISTRY } from '../../../core/constants/route-registry';
import { RouteKey } from '../../../core/constants/route-keys';

/**
 * Edit Test Results Component
 * JIRA Ticket: MLT-12750
 *
 * Features:
 * - Unit ID validation with scanner icon
 * - Collection Date display (DD-MMM-YYYY format)
 * - Scheduled/Unscheduled tests in tabs
 * - Expandable table rows with detailed test information
 * - Side panel for editing test results
 * - Pagination (default 10, options [5, 10, 25, 50])
 * - WCAG 2.1 Level AA accessibility
 */
@Component({
  selector: 'app-edit-test-results',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
    EditTestResultsSidePanelComponent
  ],
  templateUrl: './edit-test-results.component.html',
  styleUrl: './edit-test-results.component.scss'
})
export class EditTestResultsComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `edit-test-results-${EditTestResultsComponent.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @ViewChild('scheduledTable') scheduledTableComponent!: DataTable<UnitTestResultDto>;
  @ViewChild('unscheduledTable') unscheduledTableComponent!: DataTable<UnitTestResultDto>;
  @ViewChild(EditTestResultsSidePanelComponent) sidePanel!: EditTestResultsSidePanelComponent;
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly apiService = inject(EditTestResultsApiService);
  private readonly headerService = inject(HeaderService);
  private readonly menuService = inject(MenuService);

  private destroy$ = new Subject<void>();

  // Unit ID validation data from shared component
  validatedUnitData: UnitValidationResponse | null = null;

  // Signals
  protected readonly unitValidation = signal<UnitValidationDto | null>(null);
  protected readonly scheduledTests = signal<UnitTestResultDto[]>([]);
  protected readonly unscheduledTests = signal<UnitTestResultDto[]>([]);
  protected readonly allTestsWithValidCodes = signal<UnitTestResultDto[]>([]); // Store tests with validResultCodes
  protected readonly resultOptions = signal<DropdownOption[]>([]);
  protected readonly editReasonOptions = signal<DropdownOption[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly validatingUnit = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sidePanelOpen = signal<boolean>(false);
  protected readonly selectedTest = signal<UnitTestResultDto | null>(null);
  protected readonly statusAnnouncement = signal<string>('');

  // Computed signals
  protected readonly collectionDate = computed(() => {
    const validation = this.unitValidation();
    if (!validation?.collDate) return null;
    return this.formatDate(validation.collDate);
  });

  protected readonly hasScheduledTests = computed(() => this.scheduledTests().length > 0);
  protected readonly hasUnscheduledTests = computed(() => this.unscheduledTests().length > 0);
  protected readonly hasAnyTests = computed(() =>
    this.hasScheduledTests() || this.hasUnscheduledTests()
  );

  // Header config - populated dynamically from menu API
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  // Table configs - no pagination per Figma design
  scheduledTableConfig: DataTableConfig<UnitTestResultDto> = {
    columns: [],
    rowActions: [],
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No scheduled tests available',
    loadingMessage: 'Loading scheduled tests...',
    showPagination: false
  };

  unscheduledTableConfig: DataTableConfig<UnitTestResultDto> = {
    columns: [],
    rowActions: [],
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No unscheduled tests available',
    loadingMessage: 'Loading unscheduled tests...',
    showPagination: false
  };

  // Expandable rows
  expandedRows = new Set<string>();
  allRowsExpanded = signal<boolean>(false);

  constructor() {
    this.initializeConfigurations();

    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.EditTestResults]?.path;
        if (basePath) {
          const menuItem = this.menuService.findMenuItemByPath(basePath);

          if (menuItem) {
            this.headerConfig = {
              ...this.headerConfig,
              breadcrumbs: [
                { label: 'Home', link: '/home' },
                { label: menuItem.label, link: null }
              ],
              title: menuItem.label,
              subtitle: menuItem.remarks || menuItem.subtitle || ''
            };
          }
        }
      }
    });
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.loadEditReasonCodes();
  }

  private loadEditReasonCodes(): void {
    this.apiService.getEditReasonCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.editReasonOptions.set(codes.map(c => ({
            code: c.code,
            description: c.codeDesc
          })));
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading edit reason codes:', error);
          this.editReasonOptions.set([
            { code: 'BCMR', description: 'Blood Center Medical Review' },
            { code: 'LAB_ERROR', description: 'Laboratory Error' },
            { code: 'RETEST', description: 'Retest Required' },
            { code: 'OTHER', description: 'Other' }
          ]);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClear();
      });
  }

  private initializeConfigurations(): void {
    // Header config is populated dynamically from menu API
    this.headerConfig = {
      breadcrumbs: [],
      title: '',
      subtitle: '',
      actions: []
    };

    const columns = this.getTableColumns();
    const rowActions = this.getRowActions();

    this.scheduledTableConfig = {
      ...this.scheduledTableConfig,
      columns,
      rowActions
    };

    this.unscheduledTableConfig = {
      ...this.unscheduledTableConfig,
      columns,
      rowActions
    };
  }

  private getTableColumns(): TableColumn<UnitTestResultDto>[] {
    return [
      {
        key: 'testId',
        header: 'Test ID',
        width: '100px'
      },
      {
        key: 'testSeqNo',
        header: 'Sequence',
        width: '90px',
        valueFormatter: (value) => value?.toString() || '–'
      },
      {
        key: 'absValChan',
        header: 'Abs/Val/Chan',
        width: '120px',
        valueFormatter: (value) => value || '–'
      },
      {
        key: 'ratio',
        header: 'Ratio',
        width: '90px',
        valueFormatter: (value) => value || '–'
      },
      {
        key: 'tbId',
        header: 'Test Batch ID',
        width: '140px',
        valueFormatter: (value) => value || '–'
      },
      {
        key: 'resultStatus1',
        header: 'Result',
        width: '180px',
        valueFormatter: (value, row) => {
          if (!value) return '–';
          const desc = (row as UnitTestResultDto).resultStatus1Desc;
          return desc ? `${value} - ${desc}` : value;
        }
      },
      {
        key: 'editReason',
        header: 'Edit Reason',
        width: '120px',
        valueFormatter: (value) => value || '–'
      }
    ];
  }

  private getRowActions(): RowAction<UnitTestResultDto>[] {
    return [
      {
        icon: 'edit',
        label: 'Edit test result',
        ariaLabel: 'Edit test result',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Formats result date with time (DD-MMM-YYYY HH:mm format)
   */
  formatResultDate(dateString: string | undefined | null): string {
    if (!dateString) return '–';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '–';
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }

  /**
   * Called when unit ID is validated by the shared UnitIdFieldComponent
   */
  onUnitValidated(data: UnitValidationResponse): void {
    this.validatedUnitData = data;
    this.error.set(null);
    this.validateUnitAndLoadTests(data.parsedUnitId);
    this.cdr.markForCheck();
  }

  /**
   * Called when unit ID is cleared
   */
  onUnitCleared(): void {
    this.validatedUnitData = null;
    this.unitValidation.set(null);
    this.scheduledTests.set([]);
    this.unscheduledTests.set([]);
    this.allTestsWithValidCodes.set([]);
    this.error.set(null);
    this.expandedRows.clear();
    this.closeSidePanel();
    this.cdr.markForCheck();
  }

  private validateUnitAndLoadTests(unitId: string): void {
    this.validatingUnit.set(true);
    this.loading.set(true);
    this.error.set(null);
    this.unitValidation.set(null);
    this.scheduledTests.set([]);
    this.unscheduledTests.set([]);
    this.allTestsWithValidCodes.set([]);
    this.statusAnnouncement.set('Validating unit, please wait...');

    this.apiService.validateUnitAndGetTests(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.validatingUnit.set(false);
          this.loading.set(false);

          // Get validation data
          const validation = response.validation?.[0];
          if (validation) {
            this.unitValidation.set(validation);
          }

          // Check if unit exists
          if (!validation?.exists) {
            this.error.set('Unit not found in chapter');
            this.statusAnnouncement.set('Error: Unit not found in chapter');
            return;
          }

          // Show warning for labeled units but still display tests
          if (validation.isLabeled && response.errorCode === '9321') {
            this.snackBar.open(response.message || 'Warning: Unit has been labeled', 'DISMISS', {
              duration: 8000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['warning-snackbar']
            });
          }

          // Check if unit is extracted (blocking error)
          if (validation.isExtracted) {
            this.error.set('Error 2188: Unit is extracted');
            this.statusAnnouncement.set('Error: Unit is extracted and cannot be edited');
            return;
          }

          // Use pre-filtered arrays from API response
          // shiftedTests = Scheduled (UTRS table, processed)
          // unshiftedTests = Unscheduled (UNIT_TEST_BASE, pending)
          // tests = All tests with validResultCodes included
          const scheduled = response.shiftedTests || [];
          const unscheduled = response.unshiftedTests || [];
          const allTests = response.tests || [];

          this.scheduledTests.set(scheduled);
          this.unscheduledTests.set(unscheduled);
          this.allTestsWithValidCodes.set(allTests);

          // Announce successful load
          const totalTests = scheduled.length + unscheduled.length;
          this.statusAnnouncement.set(`Unit validated. Found ${totalTests} test${totalTests !== 1 ? 's' : ''}: ${scheduled.length} scheduled, ${unscheduled.length} unscheduled.`);

          // Use editReasonCodes from response if available
          if (response.editReasonCodes && response.editReasonCodes.length > 0) {
            this.editReasonOptions.set(response.editReasonCodes.map(c => ({
              code: c.code,
              description: c.codeDesc
            })));
          }

          if (this.scheduledTableConfig.pagination) {
            this.scheduledTableConfig.pagination.totalRecords = scheduled.length;
          }
          if (this.unscheduledTableConfig.pagination) {
            this.unscheduledTableConfig.pagination.totalRecords = unscheduled.length;
          }

          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error validating unit:', error);
          this.validatingUnit.set(false);
          this.loading.set(false);
          this.error.set(error.message || 'Failed to validate unit');
          this.statusAnnouncement.set('Error: Failed to validate unit');
        }
      });
  }

  onClear(): void {
    this.validatedUnitData = null;
    this.unitValidation.set(null);
    this.scheduledTests.set([]);
    this.unscheduledTests.set([]);
    this.allTestsWithValidCodes.set([]);
    this.error.set(null);
    this.expandedRows.clear();
    this.closeSidePanel();
    this.unitIdField?.clear();

    // Reset pagination
    if (this.scheduledTableConfig.pagination) {
      this.scheduledTableConfig.pagination.pageIndex = 0;
      this.scheduledTableConfig.pagination.totalRecords = 0;
    }
    if (this.unscheduledTableConfig.pagination) {
      this.unscheduledTableConfig.pagination.pageIndex = 0;
      this.unscheduledTableConfig.pagination.totalRecords = 0;
    }

    this.cdr.markForCheck();
  }

  onRowAction(event: TableRowActionEvent<UnitTestResultDto>): void {
    if (event.action === 'edit') {
      this.openEditPanel(event.row);
    }
  }

  onRowExpandToggle(row: UnitTestResultDto): void {
    const key = `${row.unitId}_${row.testId}_${row.testSeqNo}`;

    if (this.expandedRows.has(key)) {
      this.expandedRows.delete(key);
    } else {
      this.expandedRows.add(key);
    }
    this.cdr.detectChanges();
  }

  isRowExpanded(row: UnitTestResultDto): boolean {
    const key = `${row.unitId}_${row.testId}_${row.testSeqNo}`;
    return this.expandedRows.has(key);
  }

  toggleAllRows(): void {
    const allTests = [...this.scheduledTests(), ...this.unscheduledTests()];

    // Check if all rows are expanded
    const allExpanded = allTests.every(row => {
      const key = `${row.unitId}_${row.testId}_${row.testSeqNo}`;
      return this.expandedRows.has(key);
    });

    if (allExpanded) {
      // Collapse all
      this.expandedRows.clear();
      this.allRowsExpanded.set(false);
    } else {
      // Expand all
      allTests.forEach(row => {
        const key = `${row.unitId}_${row.testId}_${row.testSeqNo}`;
        this.expandedRows.add(key);
      });
      this.allRowsExpanded.set(true);
    }
    this.cdr.detectChanges();
  }

  openEditPanel(test: UnitTestResultDto): void {
    this.selectedTest.set(test);
    this.sidePanelOpen.set(true);

    // Use validResultCodes from the test object if available (from unscheduledTests)
    if (test.validResultCodes && test.validResultCodes.length > 0) {
      this.resultOptions.set(test.validResultCodes.map(r => ({
        code: r.resultStatus,
        description: r.codeDesc
      })));
      this.cdr.detectChanges();
    } else {
      // For shiftedTests (scheduled), look up validResultCodes from allTestsWithValidCodes
      const allTests = this.allTestsWithValidCodes();
      const matchingTest = allTests.find(t =>
        t.testId === test.testId &&
        t.testSeqNo === test.testSeqNo &&
        t.unitId === test.unitId
      );

      if (matchingTest?.validResultCodes && matchingTest.validResultCodes.length > 0) {
        this.resultOptions.set(matchingTest.validResultCodes.map(r => ({
          code: r.resultStatus,
          description: r.codeDesc
        })));
        this.cdr.detectChanges();
      } else {
        // Last resort fallback: call API with correct testMode and antigenFlag
        const testMode = test.testMode || 'A';
        const antigenFlag = test.antigenFlag || 'N';

        this.apiService.getValidTestResults(test.testId, testMode, antigenFlag)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (results) => {
              this.resultOptions.set(results.map(r => ({
                code: r.resultStatus,
                description: r.resultDesc
              })));
              this.cdr.detectChanges();
            },
            error: (error) => {
              console.error('Error loading valid test results:', error);
              this.resultOptions.set([
                { code: 'NEG', description: 'Negative' },
                { code: 'POS', description: 'Positive' },
                { code: 'IND', description: 'Indeterminate' },
                { code: 'NR', description: 'Nonreactive' }
              ]);
              this.cdr.detectChanges();
            }
          });
      }
    }

    this.cdr.detectChanges();
  }

  closeSidePanel(): void {
    this.sidePanelOpen.set(false);
    this.selectedTest.set(null);
    this.cdr.detectChanges();
  }

  onSidePanelSave(formValue: EditTestResultFormValue): void {
    const test = this.selectedTest();
    if (!test || !this.unitValidation()) {
      return;
    }

    const dto: UpdateTestResultDto = {
      resultStatus1: formValue.resultStatus1,
      voidReason: formValue.voidReason,
      testSeqNo: formValue.testSeqNo,
      collDate: formValue.collDate,
      absorbance: formValue.absorbance,
      ratio: formValue.ratio
    };

    this.apiService.updateTestResult(test.unitId, test.testId, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Test result updated successfully', 'Close', {
            duration: 8000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          // Reset side panel
          if (this.sidePanel) {
            this.sidePanel.resetFormAfterSave();
          }

          // Close panel
          this.closeSidePanel();

          // Reload data from API to get updated values
          this.validateUnitAndLoadTests(test.unitId);
        },
        error: (error) => {
          console.error('Error updating test result:', error);

          this.snackBar.open(error.message || 'Failed to update test result', 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });

          // Reset side panel submitting state
          if (this.sidePanel) {
            this.sidePanel.resetFormAfterError();
          }
        }
      });
  }

  private updateTestInList(test: UnitTestResultDto, formValue: EditTestResultFormValue): void {
    const updateTest = (tests: UnitTestResultDto[]) => {
      return tests.map(t => {
        if (t.unitId === test.unitId && t.testId === test.testId && t.testSeqNo === test.testSeqNo) {
          return {
            ...t,
            resultStatus1: formValue.resultStatus1,
            editReason: formValue.voidReason
          };
        }
        return t;
      });
    };

    this.scheduledTests.update(updateTest);
    this.unscheduledTests.update(updateTest);
  }

  onPageChange(event: TablePageEvent, tableType: 'scheduled' | 'unscheduled'): void {
    const config = tableType === 'scheduled' ? this.scheduledTableConfig : this.unscheduledTableConfig;

    if (config.pagination) {
      config.pagination.pageIndex = event.pageIndex;
      config.pagination.pageSize = event.pageSize;
    }

    this.cdr.detectChanges();
  }

}
