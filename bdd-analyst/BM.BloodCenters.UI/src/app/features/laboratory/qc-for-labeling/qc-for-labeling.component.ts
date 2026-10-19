import {
  Component as NgComponent,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  TemplateRef,
  inject,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { LabQcService } from './services/lab-qc.service';
import {
  UnitQcStatus,
  TestBatchDropdown,
  SaveQcLabelRequest
} from './models/lab-qc-summary.model';
import { ComponentDto } from './models/component.model';
import { UnitTestResultDto } from './models/unit-test-result.model';
import { UnitTestBaseDto } from './models/unit-test-base.model';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { MenuService } from '@shared/services/menu.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { RouteKey } from '@core/constants/route-keys';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';

interface ComponentRow {
  productCode: string;
  bag: string;
  expirationDate: string;
  sld: string;
  reject: string;
  insertDate: string;
  labelDate: string;
}

interface TestRow {
  testId: string;
  ts: number;
  result: string;
  tbId: string;
  absorbence: string;
  ratio: string;
}

type PanelSection = 'components' | 'tests';

@NgComponent({
  selector: 'app-qc-for-labeling',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatMenuModule,
    PageHeaderWithBreadcrumb,
    DataTable
  ],
  templateUrl: './qc-for-labeling.component.html',
  styleUrl: './qc-for-labeling.component.scss'
})
export class QcForLabelingComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('componentReviewTpl') componentReviewTpl!: TemplateRef<any>;
  @ViewChild('qcLabelFlagTpl') qcLabelFlagTpl!: TemplateRef<any>;

  private static nextId = 0;
  protected readonly componentId = `qc-for-labeling-${QcForLabelingComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly labQcService = inject(LabQcService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly menuService = inject(MenuService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  protected readonly loading = signal<boolean>(false);
  protected readonly saving = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly qcData = signal<UnitQcStatus[]>([]);
  protected readonly filteredData = signal<UnitQcStatus[]>([]);
  protected readonly testingChapter = signal<string>('-');
  protected readonly unscheduledCount = signal<number>(0);
  protected readonly selectedBatch = signal<string | null>(null);
  protected readonly batches = signal<TestBatchDropdown[]>([]);

  protected readonly sidePanelOpen = signal<boolean>(false);
  protected readonly sidePanelRow = signal<UnitQcStatus | null>(null);
  protected readonly currentPanelSection = signal<PanelSection | null>(null);
  protected readonly componentRows = signal<ComponentRow[]>([]);
  protected readonly scheduledTests = signal<TestRow[]>([]);
  protected readonly unscheduledTests = signal<TestRow[]>([]);
  protected readonly panelLoading = signal<boolean>(false);

  protected readonly hasData = computed(() => this.filteredData().length > 0);
  protected readonly isReady = computed(() => !this.loading() && !this.error());

  protected readonly componentReviewOptions = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' }
  ];

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  filterForm!: FormGroup;

  tableConfig: DataTableConfig<UnitQcStatus> = {
    columns: [
      { key: 'sequenceNumber', header: 'Sequence\nNumber', type: 'text', minWidth: '80px' },
      { key: 'displayUnitId', header: 'Unit ID', type: 'text', minWidth: '160px' },
      { key: 'donorInterface', header: 'Donor Interface', type: 'text', minWidth: '130px', valueFormatter: (v: any) => v === 'Y' ? 'Yes' : v === 'N' ? 'No' : v },
      { key: 'testingFlag', header: 'Profile Tests\nCompleted', type: 'text', minWidth: '130px', valueFormatter: (v: any) => v === 'Y' ? 'Yes' : v === 'N' ? 'No' : v },
      { key: 'nursingAuditFlag', header: 'Audit Status\nComplete', type: 'text', minWidth: '130px', valueFormatter: (v: any) => v === 'Y' ? 'Yes' : v === 'N' ? 'No' : v },
      { key: 'componentReview', header: 'Component Review', type: 'text', minWidth: '140px', valueFormatter: (v: any) => v === 'Y' ? 'Yes' : v === 'N' ? 'No' : v },
      { key: 'qcLabelFlag', header: 'QC for Labeling', type: 'text', minWidth: '120px', valueFormatter: (v: any) => v === 'Y' ? 'Yes' : v === 'N' ? 'No' : v }
    ],
    rowActions: [
      { label: 'View Test', action: 'viewUnitTests' },
      { label: 'View Components', action: 'viewComponents' }
    ],
    showActionsAsMenu: true,
    showPagination: false,
    stickyHeader: true,
    enableRowHighlight: false
  };

  componentsTableConfig: DataTableConfig<ComponentRow> = {
    columns: [
      { key: 'productCode', header: 'Product Code', type: 'text', minWidth: '110px' },
      { key: 'bag', header: 'Bag', type: 'text', minWidth: '20px' },
      { key: 'expirationDate', header: 'Expiration Date', type: 'text', minWidth: '130px' },
      { key: 'sld', header: 'SLD', type: 'text', minWidth: '20px' },
      { key: 'reject', header: 'Reject', type: 'text', minWidth: '20px' },
      { key: 'insertDate', header: 'Insert Date', type: 'text', minWidth: '130px' },
      { key: 'labelDate', header: 'Label Date', type: 'text', minWidth: '130px' }
    ],
    showPagination: false,
    stickyHeader: true,
    enableRowHighlight: false
  };

  testsTableConfig: DataTableConfig<TestRow> = {
    columns: [
      { key: 'testId', header: 'Test ID', type: 'text', minWidth: '100px' },
      { key: 'ts', header: 'TS', type: 'text', minWidth: '50px' },
      { key: 'result', header: 'Result', type: 'text', minWidth: '70px' },
      { key: 'tbId', header: 'TB ID', type: 'text', minWidth: '130px' },
      { key: 'absorbence', header: 'Absorbence', type: 'text', minWidth: '100px' },
      { key: 'ratio', header: 'Ratio', type: 'text', minWidth: '70px' }
    ],
    showPagination: false,
    stickyHeader: true,
    enableRowHighlight: false
  };

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.QcForLabeling]?.path;
        const menuItem = basePath ? this.menuService.findMenuItemByPath(basePath) : null;

        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || 'Document details of interest at the component level.'
          };
        }
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadBatches();
    this.subscribeToChapterChanges();
    this.setTestingChapter();
  }

  ngAfterViewInit(): void {
    if (this.componentReviewTpl) {
      const crCol = this.tableConfig.columns.find(c => c.key === 'componentReview');
      if (crCol) {
        crCol.cellTemplate = this.componentReviewTpl;
      }
    }
    if (this.qcLabelFlagTpl) {
      const qcCol = this.tableConfig.columns.find(c => c.key === 'qcLabelFlag');
      if (qcCol) {
        qcCol.cellTemplate = this.qcLabelFlagTpl;
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      aboRhBatch: [null]
    });

    this.filterForm.get('aboRhBatch')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((tbId) => {
        this.selectedBatch.set(tbId);
        if (tbId) {
          this.loadBatchUnits(tbId);
        } else {
          this.qcData.set([]);
          this.filteredData.set([]);
          this.unscheduledCount.set(0);
          this.testingChapter.set('-');
        }
      });
  }

  private setTestingChapter(): void {
    this.testingChapter.set('-');
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetState();
        this.setTestingChapter();
        this.loadBatches();
      });
  }

  private resetState(): void {
    this.qcData.set([]);
    this.filteredData.set([]);
    this.batches.set([]);
    this.selectedBatch.set(null);
    this.unscheduledCount.set(0);
    this.error.set(null);
    this.loading.set(false);
    this.filterForm.reset();
  }

  private loadBatches(): void {
    this.loading.set(true);
    this.error.set(null);

    this.labQcService.getTestBatches()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (batches) => {
          this.batches.set(batches);
        },
        error: (err) => {
          this.showError('Failed to load test batches.');
        }
      });
  }

  private loadBatchUnits(tbId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.labQcService.getBatchUnits(tbId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (response) => {
          this.qcData.set(response.units);
          this.filteredData.set(response.units);
          this.unscheduledCount.set(response.unscheduledUnitCount);
          if (response.testChapterId) {
            this.testingChapter.set(response.testChapterId === 'Y' ? 'Yes' : response.testChapterId === 'N' ? 'No' : response.testChapterId);
          }
        },
        error: (err) => {
          this.showError('Failed to load batch units.');
        }
      });
  }

  onComponentReviewChange(row: UnitQcStatus, value: string): void {
    const updated = this.filteredData().map(r => {
      if (r.unitId === row.unitId && r.collDate === row.collDate) {
        const updatedRow = { ...r, componentReview: value };
        if (
          value === 'Y' &&
          updatedRow.donorInterface === 'Y' &&
          updatedRow.testingFlag === 'Y' &&
          (updatedRow.nursingAuditFlag === 'Y' || updatedRow.nursingAuditFlag === '*')
        ) {
          updatedRow.qcLabelFlag = 'Y';
        }
        return updatedRow;
      }
      return r;
    });
    this.filteredData.set(updated);
    this.qcData.set(updated);
  }

  onQcLabelFlagChange(row: UnitQcStatus, value: string): void {
    if (
      value === 'Y' &&
      (row.donorInterface !== 'Y' ||
        row.testingFlag !== 'Y' ||
        (row.nursingAuditFlag !== 'Y' && row.nursingAuditFlag !== '*'))
    ) {
      this.snackbarService.showError(
        'QC for Labeling cannot be set to Yes unless Donor Interface is Yes, Profile Tests are Completed, and Audit Status is Complete.'
      );
      const reverted = this.filteredData().map(r =>
        r.unitId === row.unitId && r.collDate === row.collDate
          ? { ...r, qcLabelFlag: row.qcLabelFlag }
          : r
      );
      this.filteredData.set([...reverted]);
      return;
    }

    const updated = this.filteredData().map(r =>
      r.unitId === row.unitId && r.collDate === row.collDate
        ? { ...r, qcLabelFlag: value }
        : r
    );
    this.filteredData.set(updated);
    this.qcData.set(updated);
  }

  onRowAction(event: TableRowActionEvent<UnitQcStatus>): void {
    switch (event.action) {
      case 'viewComponents':
        this.onViewComponents(event.row);
        break;
      case 'viewUnitTests':
        this.onViewUnitTests(event.row);
        break;
    }
  }

  onViewComponents(record: UnitQcStatus): void {
    this.sidePanelRow.set(record);
    this.currentPanelSection.set('components');
    this.panelLoading.set(true);
    this.sidePanelOpen.set(true);

    this.labQcService.getQcSummary(record.unitId, record.collDate)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.panelLoading.set(false))
      )
      .subscribe({
        next: (summary) => {
          this.componentRows.set(
            (summary.components || []).map(c => this.mapComponentToRow(c))
          );
        },
        error: () => {
          this.componentRows.set([]);
          this.snackbarService.showError('Failed to load component details.');
        }
      });
  }

  onViewUnitTests(record: UnitQcStatus): void {
    this.sidePanelRow.set(record);
    this.currentPanelSection.set('tests');
    this.panelLoading.set(true);
    this.sidePanelOpen.set(true);

    this.labQcService.getQcSummary(record.unitId, record.collDate)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.panelLoading.set(false))
      )
      .subscribe({
        next: (summary) => {
          this.scheduledTests.set(summary.testResults.map(t => this.mapTestResultToRow(t)));
          this.unscheduledTests.set(summary.testBase.map(t => this.mapTestBaseToRow(t)));
        },
        error: () => {
          this.scheduledTests.set([]);
          this.unscheduledTests.set([]);
          this.snackbarService.showError('Failed to load test data.');
        }
      });
  }

  onPanelClose(): void {
    this.sidePanelOpen.set(false);
    this.sidePanelRow.set(null);
    this.currentPanelSection.set(null);
    this.componentRows.set([]);
    this.scheduledTests.set([]);
    this.unscheduledTests.set([]);
  }

  onClear(): void {
    this.filterForm.reset();
    this.qcData.set([]);
    this.filteredData.set([]);
    this.selectedBatch.set(null);
    this.unscheduledCount.set(0);
    this.error.set(null);
    this.setTestingChapter();
  }

  onSave(): void {
    const records = this.filteredData();
    if (records.length === 0) return;

    const request: SaveQcLabelRequest = {
      items: records.map(r => ({
        unitId: r.unitId,
        collDate: r.collDate,
        chapterId: r.chapterId,
        componentReview: r.componentReview ?? null,
        qcLabelFlag: r.qcLabelFlag ?? null
      }))
    };

    this.saving.set(true);

    this.labQcService.saveQcLabels(request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: (response) => {
          this.snackbarService.showSuccess(response.message || 'QC records saved successfully.');
          const currentBatch = this.selectedBatch();
          if (currentBatch) {
            this.loadBatchUnits(currentBatch);
          }
        },
        error: (err) => {
          const message = err?.error?.message || 'Failed to save QC records.';
          this.snackbarService.showError(message);
        }
      });
  }

  private mapComponentToRow(c: ComponentDto): ComponentRow {
    return {
      productCode: c.productCode || '-',
      bag: c.bagId || '-',
      expirationDate: this.formatDate(c.expirationDate || c.expDate),
      sld: c.systemLabelDecision || '-',
      reject: c.rejectReasonCode || '-',
      insertDate: this.formatDate(c.insertDate),
      labelDate: this.formatDate(c.labelDats)
    };
  }

  private mapTestResultToRow(t: UnitTestResultDto): TestRow {
    return {
      testId: t.testId,
      ts: t.testSeqNo,
      result: t.testResult || '-',
      tbId: t.tbId || '-',
      absorbence: t.absorbance || '-',
      ratio: t.ratio || '-'
    };
  }

  private mapTestBaseToRow(t: UnitTestBaseDto): TestRow {
    return {
      testId: t.testId,
      ts: t.testSeqNo,
      result: '-',
      tbId: '-',
      absorbence: '-',
      ratio: '-'
    };
  }

  private formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '-';
      const day = date.getDate().toString().padStart(2, '0');
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day}-${month}-${year} ${hours}:${minutes}`;
    } catch {
      return '-';
    }
  }

  private showError(message: string): void {
    this.error.set(message);
    this.snackbarService.showError(message);
  }
}
