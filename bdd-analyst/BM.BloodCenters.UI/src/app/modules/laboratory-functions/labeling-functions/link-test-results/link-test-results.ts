import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { LoggingService } from '@shared/services/logging.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import {
  UnitIdFieldComponent,
  UnitValidationResponse,
} from '@shared/components/unit-id-field';

import { LinkTestResultsApiService } from './services/link-test-results-api.service';
import { TestResultDto, ValidateResponseData } from './models/link-test-results.model';

interface TestRowDto extends TestResultDto {
  rowKey: string;
}

/**
 * Link Test Results Component
 * Transfer test results from a sample unit to a primary (target) unit.
 *
 * Mnemonic: LINKL
 * FMB: FRILINK
 */
@Component({
  selector: 'app-link-test-results',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
  ],
  templateUrl: './link-test-results.html',
  styleUrl: './link-test-results.scss',
})
export class LinkTestResultsComponent implements OnInit, OnDestroy {
  @ViewChild('unitIdField') unitIdFieldRef!: UnitIdFieldComponent;
  @ViewChild('sampleUnitIdField') sampleUnitIdFieldRef!: UnitIdFieldComponent;

  private readonly apiService = inject(LinkTestResultsApiService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly loggingService = inject(LoggingService);
  private readonly snackBar = inject(MatSnackBar);

  // ─── Unit ID state ────────────────────────────────────────────────────────
  readonly parsedUnitId = signal<string | null>(null);
  readonly parsedSampleUnitId = signal<string | null>(null);

  // ─── Screen state ─────────────────────────────────────────────────────────
  readonly validating = signal(false);
  readonly transmitting = signal(false);
  readonly validationData = signal<ValidateResponseData | null>(null);

  // Left panel: sampleTransferableTests — user selects which tests to transfer
  readonly sampleTests = signal<TestRowDto[]>([]);
  // Right panel: primaryCompletedTests — read-only reference
  readonly primaryTests = signal<TestRowDto[]>([]);

  // Set of rowKey strings driving DataTable's external selection
  readonly selectedKeys = signal<Set<string>>(new Set());

  // Prevents auto-select-all after a successful transmit
  private skipNextAutoSelect = false;

  // ─── Transmit form ────────────────────────────────────────────────────────
  readonly transmitForm = new FormGroup({
    transmitTestResults: new FormControl<string | null>(null, Validators.required),
  });

  // ─── Computed ─────────────────────────────────────────────────────────────
  readonly hasData = computed(() => this.validationData() !== null);

  readonly transmitAll = computed(
    () => this.transmitForm.get('transmitTestResults')?.value === 'yes'
  );

  readonly allSelected = computed(() => {
    const tests = this.sampleTests();
    return tests.length > 0 && tests.every(t => this.selectedKeys().has(t.rowKey));
  });

  readonly canTransmit = computed(
    () => !this.transmitting() && this.hasData() && this.selectedKeys().size > 0
  );

  // ─── DataTable configs ────────────────────────────────────────────────────

  readonly leftTableConfig: DataTableConfig<TestRowDto> = {
    columns: [
      { key: 'testId', header: 'Test ID', width: '90px' },
      { key: 'testDescription', header: 'Description' },
      { key: 'testSeqNo', header: 'TSN', width: '60px' },
      { key: 'resultStatus', header: 'Result', width: '80px' },
      { key: 'absorbance', header: 'Absorbance', width: '100px' },
    ],
    enableSelection: true,
    selectionPosition: 'first',
    selectionKey: 'rowKey',
    showPagination: false,
    stickyHeader: true,
    showTableOnEmpty: true,
    emptyMessage: 'No tests available',
    enableRowHighlight: false,
  };

  readonly rightTableConfig: DataTableConfig<TestRowDto> = {
    columns: [
      { key: 'testId', header: 'Test ID', width: '90px' },
      { key: 'testDescription', header: 'Description' },
      { key: 'testSeqNo', header: 'TSN', width: '60px' },
      { key: 'resultStatus', header: 'Result', width: '80px' },
    ],
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No tests available',
    enableRowHighlight: false,
  };

  // ─── Page header ──────────────────────────────────────────────────────────

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Link Test Results' },
    ],
    title: 'Link Test Results',
    subtitle: 'Document details of interest at the component level.',
    actions: [],
  };

  private destroy$ = new Subject<void>();

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || this.headerConfig.subtitle || '',
        };
      }
    });
  }

  ngOnInit(): void {
    this.setupTransmitListener();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Setup ────────────────────────────────────────────────────────────────

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
      });
  }

  private setupTransmitListener(): void {
    this.transmitForm
      .get('transmitTestResults')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (this.hasData()) {
          // Panels already loaded — update checkbox state only
          if (value === 'yes') {
            this.selectAll(true);
          } else {
            this.selectAll(false);
          }
        } else {
          // Dropdown may be the last required field — try to run validation
          this.tryRunValidation();
        }
      });
  }

  // ─── UnitIdField events ───────────────────────────────────────────────────

  onUnitIdValidated(data: UnitValidationResponse): void {
    this.parsedUnitId.set(data.parsedUnitId);
    this.clearValidationData();
    this.tryRunValidation();
  }

  onSampleUnitIdValidated(data: UnitValidationResponse): void {
    this.parsedSampleUnitId.set(data.parsedUnitId);
    this.clearValidationData();
    this.tryRunValidation();
  }

  onUnitIdCleared(): void {
    this.parsedUnitId.set(null);
    this.clearValidationData();
  }

  onSampleUnitIdCleared(): void {
    this.parsedSampleUnitId.set(null);
    this.clearValidationData();
  }

  private tryRunValidation(): void {
    const unitId = this.parsedUnitId();
    const sampleUnitId = this.parsedSampleUnitId();
    const transmitTestResults = this.transmitForm.get('transmitTestResults')?.value;
    if (unitId && sampleUnitId && transmitTestResults) {
      this.runValidation(unitId, sampleUnitId);
    }
  }

  // ─── Validate API call ────────────────────────────────────────────────────

  private runValidation(unitId: string, sampleUnitId: string): void {
    this.validating.set(true);
    this.clearValidationData();

    this.apiService
      .validate({ sourceUnitId: sampleUnitId, targetUnitId: unitId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.validating.set(false);
          if (!response.data?.canTransfer) {
            const msg = response.message || 'Transfer is not eligible for these units';
            this.snackBar.open(msg, 'DISMISS', {
              duration: 6000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            });
            return;
          }
          this.validationData.set(response.data);
          this.sampleTests.set(this.toRows(response.data.sampleTransferableTests));
          this.primaryTests.set(this.toRows(response.data.primaryCompletedTests));
          if (!this.skipNextAutoSelect && this.transmitForm.get('transmitTestResults')?.value === 'yes') {
            this.selectAll(true);
          }
          this.skipNextAutoSelect = false;
        },
        error: (error) => {
          this.validating.set(false);
          const msg =
            error?.error?.message ||
            error?.message ||
            'Validation failed. Please check the unit IDs.';
          this.snackBar.open(msg, 'DISMISS', {
            duration: 6000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
          this.loggingService.error('Link Test Results validation failed', error);
        },
      });
  }

  private toRows(tests: TestResultDto[]): TestRowDto[] {
    return (tests || []).map(t => ({
      ...t,
      rowKey: `${t.testId}:${t.testSeqNo}`,
    }));
  }

  // ─── Selection ────────────────────────────────────────────────────────────

  // Passed as [externalSelectedIds] to the left DataTable
  get externalSelectedKeys(): Set<string> {
    return this.selectedKeys();
  }

  onLeftSelectionChange(selectedRows: TestRowDto[]): void {
    this.selectedKeys.set(new Set(selectedRows.map(r => r.rowKey)));
  }

  private selectAll(checked: boolean): void {
    if (checked) {
      this.selectedKeys.set(new Set(this.sampleTests().map(t => t.rowKey)));
    } else {
      this.selectedKeys.set(new Set());
    }
  }

  // ─── Transmit ─────────────────────────────────────────────────────────────

  onTransmit(): void {
    const unitId = this.parsedUnitId();
    const sampleUnitId = this.parsedSampleUnitId();
    if (!unitId || !sampleUnitId) return;

    const selectedTests = this.sampleTests()
      .filter(t => this.selectedKeys().has(t.rowKey))
      .map(t => ({ testId: t.testId, testSeqNo: t.testSeqNo }));

    const isTransferAll = this.allSelected();

    const request = {
      sourceUnitId: sampleUnitId,
      targetUnitId: unitId,
      confirm: true,
      transferAll: isTransferAll,
      ...(isTransferAll ? {} : { selectedTests }),
    };

    this.transmitting.set(true);

    this.apiService
      .transfer(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.transmitting.set(false);
          const count = response.data?.testResultsTransferred ?? 0;
          this.snackBar.open(`${count} Tests Transmitted successfully.`, 'DISMISS', {
            duration: 0,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
          });
          this.selectedKeys.set(new Set());
          this.skipNextAutoSelect = true;
          this.runValidation(unitId, sampleUnitId);
        },
        error: (error) => {
          this.transmitting.set(false);
          const msg =
            error?.error?.message || error?.message || 'Transfer failed. Please try again.';
          this.snackBar.open(msg, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
          this.loggingService.error('Link Test Results transfer failed', error);
        },
      });
  }

  // ─── Clear ────────────────────────────────────────────────────────────────

  onClearAll(): void {
    this.unitIdFieldRef?.clear();
    this.sampleUnitIdFieldRef?.clear();
    this.transmitForm.reset();
    this.parsedUnitId.set(null);
    this.parsedSampleUnitId.set(null);
    this.clearValidationData();
  }

  private clearValidationData(): void {
    this.validationData.set(null);
    this.sampleTests.set([]);
    this.primaryTests.set([]);
    this.selectedKeys.set(new Set());
  }

  // ─── Table data accessors ─────────────────────────────────────────────────

  get sampleTestsData(): TestRowDto[] {
    return this.sampleTests();
  }

  get primaryTestsData(): TestRowDto[] {
    return this.primaryTests();
  }
}
