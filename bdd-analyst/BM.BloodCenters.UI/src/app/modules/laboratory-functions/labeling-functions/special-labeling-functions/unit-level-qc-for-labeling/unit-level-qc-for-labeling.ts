import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  signal,
  inject,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { A11yModule, ConfigurableFocusTrapFactory, FocusTrap } from '@angular/cdk/a11y';
import { Subject, takeUntil, forkJoin, of, catchError } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent } from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  UnitIdFieldComponent,
  UnitIdPostValidateEvent,
  UnitValidationResponse as SharedUnitValidationResponse
} from '@shared/components/unit-id-field';

import { UnitLevelQcApiService } from './services/unit-level-qc-api.service';
import { QcStatusDto, ComponentDto, TestDto } from './models/unit-level-qc.model';
import { ViewTestPanel, ViewTestRow } from './view-test-panel/view-test-panel';

export interface UnitQcTableRow {
  productCode: string;
  catalogNumber: string;
  expirationDate: string;
  rejectReasonCode: string;
  rejectDateTime: string;
  systemLabelDecision: string;
  labelDate: string;
}

@Component({
  selector: 'app-unit-level-qc-for-labeling',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    A11yModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    ViewTestPanel,
    UnitIdFieldComponent
  ],
  templateUrl: './unit-level-qc-for-labeling.html',
  styleUrls: ['./unit-level-qc-for-labeling.scss']
})
export class UnitLevelQcForLabelingComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `unit-level-qc-${UnitLevelQcForLabelingComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;
  @ViewChild('sidePanel') sidePanelRef!: ElementRef<HTMLElement>;

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(UnitLevelQcApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly focusTrapFactory = inject(ConfigurableFocusTrapFactory);
  private destroy$ = new Subject<void>();
  private focusTrap: FocusTrap | null = null;
  private previousFocusElement: HTMLElement | null = null;

  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly hasSearched = signal<boolean>(false);

  protected readonly displayUnitId = signal<string>('');
  private readonly storedCodeScheme = signal<string>('I');
  private readonly storedParsedUnitId = signal<string>('');

  protected readonly sidePanelOpen = signal<boolean>(false);
  protected readonly sidePanelLoading = signal<boolean>(false);
  protected readonly scheduledTests = signal<ViewTestRow[]>([]);
  protected readonly unscheduledTests = signal<ViewTestRow[]>([]);

  protected readonly donorInterface = signal<string>('—');
  protected readonly testingOk = signal<string>('—');
  protected readonly nursingAudit = signal<string>('—');

  protected readonly tableData = signal<UnitQcTableRow[]>([]);
  protected readonly totalRecords = signal<number>(0);

  private qcStatusData: QcStatusDto | null = null;
  protected readonly saving = signal<boolean>(false);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  searchForm!: FormGroup;

  protected readonly componentReviewOptions = signal<{ value: string; label: string }[]>([
    { value: '', label: '—' },
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' }
  ]);

  protected readonly qcForLabelingOptions = signal<{ value: string; label: string }[]>([
    { value: '', label: '—' },
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' }
  ]);

  tableConfig: DataTableConfig<UnitQcTableRow> = {
    columns: [
      { key: 'productCode', header: 'Product Code', sortable: false, type: 'text', minWidth: '130px' },
      { key: 'catalogNumber', header: 'Catalog Number', sortable: false, type: 'text', minWidth: '150px' },
      { key: 'expirationDate', header: 'Expiration Date', sortable: false, type: 'text', minWidth: '170px' },
      { key: 'rejectReasonCode', header: 'Reject Reason Code', sortable: false, type: 'text', minWidth: '170px' },
      { key: 'rejectDateTime', header: 'Reject Date & Time', sortable: false, type: 'text', minWidth: '180px' },
      { key: 'systemLabelDecision', header: 'System Label\nDecision', sortable: false, type: 'text', minWidth: '150px' },
      { key: 'labelDate', header: 'Label Date', sortable: false, type: 'text', minWidth: '170px' }
    ],
    stickyHeader: true,
    enableRowHighlight: false,
    showPagination: true,
    pagination: {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50]
    }
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  get f() {
    return this.searchForm.controls;
  }

  get componentReviewControl(): FormControl {
    return this.searchForm.get('componentReview') as FormControl;
  }

  get qcForLabelingControl(): FormControl {
    return this.searchForm.get('qcForLabeling') as FormControl;
  }

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroyFocusTrap();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      componentReview: [null],
      qcForLabeling: [null]
    });

    this.componentReviewControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (value === 'Y' && this.arePrerequisitesMet()) {
          this.qcForLabelingControl.setValue('Y', { emitEvent: false });
        }
      });

    this.qcForLabelingControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (value === 'Y' && !this.arePrerequisitesMet()) {
          this.qcForLabelingControl.setValue(null, { emitEvent: false });
          this.snackbarService.showError('Cannot QC label — prerequisites not met');
        }
      });
  }

  private arePrerequisitesMet(): boolean {
    return this.donorInterface() === 'Yes'
      && this.testingOk() === 'Yes'
      && (this.nursingAudit() === 'Pass' || this.nursingAudit() === 'N/A');
  }

  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    this.displayUnitId.set(event.data.manualUnitId);
    this.storedCodeScheme.set(event.data.codeScheme);
    this.storedParsedUnitId.set(event.data.parsedUnitId);

    this.apiService.validateUnit(event.data.parsedUnitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            event.confirm();
          } else {
            event.reject(response.message ?? 'Unit validation failed');
            this.resetUnitState();
          }
        },
        error: (err) => {
          const errorMessage = err.error?.message || err.error?.errorResponse?.error || 'Failed to validate unit';
          event.reject(errorMessage);
          this.resetUnitState();
        }
      });
  }

  onUnitValidated(_data: SharedUnitValidationResponse): void {
    this.retrieveUnitData();
  }

  onUnitCleared(): void {
    this.resetUnitState();
  }

  private resetUnitState(): void {
    this.displayUnitId.set('');
    this.storedCodeScheme.set('I');
    this.storedParsedUnitId.set('');
    this.donorInterface.set('—');
    this.testingOk.set('—');
    this.nursingAudit.set('—');
    this.qcStatusData = null;
    this.searchForm.patchValue({ componentReview: null, qcForLabeling: null }, { emitEvent: false });
    this.tableData.set([]);
    this.totalRecords.set(0);
    this.error.set(null);
    this.hasSearched.set(false);
  }

  private retrieveUnitData(): void {
    const parsedUnitId = this.storedParsedUnitId();
    if (!parsedUnitId) return;

    this.loading.set(true);
    this.error.set(null);
    this.hasSearched.set(true);

    forkJoin({
      qcStatus: this.apiService.getQcStatus(parsedUnitId),
      components: this.apiService.getComponents(parsedUnitId)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ qcStatus, components }) => {
          if (qcStatus.success && qcStatus.item) {
            const status = qcStatus.item;
            this.qcStatusData = status;

            this.donorInterface.set(status.donorInterface === 'Y' ? 'Yes' : 'No');
            this.testingOk.set(status.testingFlag === 'Y' ? 'Yes' : 'No');
            this.nursingAudit.set(
              status.nursingAuditFlag === '*' ? 'N/A' :
              status.nursingAuditFlag === 'Y' ? 'Pass' : 'Fail'
            );

            this.searchForm.patchValue({
              componentReview: status.componentReview || null,
              qcForLabeling: status.qcLabelFlag || null
            }, { emitEvent: false });
          }

          if (components.success && components.data && components.data.length > 0) {
            const rows = this.mapComponentsToTableRows(components.data);
            this.tableData.set(rows);
            this.totalRecords.set(components.total || rows.length);

            this.tableConfig = {
              ...this.tableConfig,
              pagination: {
                ...this.tableConfig.pagination!,
                totalRecords: components.total || rows.length
              }
            };
          } else if (components.message) {
            this.snackbarService.showError(components.message);
          }

          this.loading.set(false);
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Failed to retrieve unit data';
          this.error.set(errorMessage);
          this.loading.set(false);
        }
      });
  }

  private mapComponentsToTableRows(components: ComponentDto[]): UnitQcTableRow[] {
    return components.map(c => ({
      productCode: c.productCode || '—',
      catalogNumber: c.bagId || '—',
      expirationDate: this.formatDateTime(c.expiryDate),
      rejectReasonCode: c.rejectReasonCode || '—',
      rejectDateTime: this.formatDateTime(c.insertDats),
      systemLabelDecision: c.systemLabelDecision || '—',
      labelDate: this.formatDateTime(c.labelDats)
    }));
  }

  private formatDateTime(value: string | null | undefined): string {
    if (!value) return '—';
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!match) return '—';
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                     'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const yyyy = match[1];
    const mmm = months[parseInt(match[2], 10) - 1];
    const dd = match[3];
    const hh = match[4];
    const min = match[5];
    return `${dd}-${mmm}-${yyyy} ${hh}:${min}`;
  }

  onViewTest(): void {
    const parsedUnitId = this.storedParsedUnitId();
    if (!parsedUnitId) return;

    this.previousFocusElement = document.activeElement as HTMLElement;
    this.sidePanelLoading.set(true);

    const emptyResponse: { success: boolean; data: never[]; total: number; message: string; statusCode: number } =
      { success: false, data: [], total: 0, message: '', statusCode: 400 };

    forkJoin({
      scheduled: this.apiService.getScheduledTests(parsedUnitId).pipe(
        catchError(err => of({ ...emptyResponse, message: err.error?.message || '' }))
      ),
      unscheduled: this.apiService.getUnscheduledTests(parsedUnitId).pipe(
        catchError(err => of({ ...emptyResponse, message: err.error?.message || '' }))
      )
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ scheduled, unscheduled }) => {
          const scheduledRows = this.mapTestsToViewRows(scheduled.data || []);
          const unscheduledRows = this.mapTestsToViewRows(unscheduled.data || []);

          if (scheduledRows.length === 0 && unscheduledRows.length === 0) {
            const errorMessage = scheduled.message || unscheduled.message || 'No tests found for this unit';
            this.snackbarService.showError(errorMessage);
            this.sidePanelOpen.set(false);
            this.sidePanelLoading.set(false);
            return;
          }

          this.scheduledTests.set(scheduledRows);
          this.unscheduledTests.set(unscheduledRows);
          this.sidePanelLoading.set(false);
          this.sidePanelOpen.set(true);
          this.activateFocusTrap();
        },
        error: () => {
          this.snackbarService.showError('Failed to load test data');
          this.sidePanelOpen.set(false);
          this.sidePanelLoading.set(false);
        }
      });
  }

  private mapTestsToViewRows(tests: TestDto[]): ViewTestRow[] {
    return tests.map(t => ({
      testId: t.testId,
      ts: t.testSeqNo,
      result: t.resultStatus1,
      tbId: t.tbId,
      absorbance: t.absorbance || '—',
      ratio: t.ratio || '—'
    }));
  }

  onPanelClose(): void {
    this.destroyFocusTrap();
    this.sidePanelOpen.set(false);
    this.previousFocusElement?.focus();
    this.previousFocusElement = null;
  }

  private activateFocusTrap(): void {
    setTimeout(() => {
      if (this.sidePanelRef?.nativeElement) {
        this.focusTrap = this.focusTrapFactory.create(this.sidePanelRef.nativeElement);
        this.focusTrap.focusInitialElementWhenReady();
      }
    });
  }

  private destroyFocusTrap(): void {
    if (this.focusTrap) {
      this.focusTrap.destroy();
      this.focusTrap = null;
    }
  }

  onPageChange(event: TablePageEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageSize: event.pageSize,
        pageIndex: event.pageIndex
      }
    };
  }

  onRetry(): void {
    this.retrieveUnitData();
  }

  onSave(): void {
    const parsedUnitId = this.storedParsedUnitId();
    if (!parsedUnitId) return;

    const componentReview = this.searchForm.get('componentReview')?.value || 'N';
    const qcLabelFlag = this.searchForm.get('qcForLabeling')?.value || 'N';

    this.saving.set(true);

    this.apiService.commitQc(parsedUnitId, { componentReview, qcLabelFlag })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          if (response.success) {
            this.snackbarService.showSuccess(response.message || 'QC results committed successfully');
            this.unitIdField?.clear();
            this.resetUnitState();
            setTimeout(() => this.unitIdField?.focus());
          } else {
            this.snackbarService.showError(response.message || 'Failed to commit QC results');
          }
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Failed to commit QC results';
          this.snackbarService.showError(errorMessage);
          this.saving.set(false);
        }
      });
  }

  onClearAll(): void {
    this.unitIdField?.clear();
    this.resetUnitState();
  }
}
