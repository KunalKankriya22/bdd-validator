import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { RouteKey } from '@core/constants/route-keys';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { formatTableDate, formatTableDateTime } from '@shared/utils/date-format.util';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { QuickLinks } from '@shared/components/quick-links/quick-links';
import { QuickLink } from '@shared/interfaces/dialog.interface';
import { DonationNotesDialog } from '@shared/components/donation-notes/donation-notes';
import { DonationNotesDialogData } from '@shared/components/donation-notes/donation-notes.model';
import { SmartDropdownComponent, DropdownItem } from '@shared/components/smart-dropdown/smart-dropdown';
import {
  BatchNotesDialog as TestBatchNotesDialog,
  BatchNotesDialogData as TestBatchNotesDialogData,
} from '../../../../test-batch-details-query/components/batch-notes-dialog/batch-notes-dialog';
import { GenericNotesDialog } from '@shared/components/generic-notes-dialog/generic-notes-dialog';
import { GenericNotesDialogData } from '@shared/components/generic-notes-dialog/generic-notes-dialog.model';

import { SamplesQueryApiService } from './services/samples-query-api.service';
import { SamplesQueryStateService } from './services/samples-query-state.service';
import {
  SamplesQuerySearchRequest,
  UnitRecord,
  UnitDetailsResponse,
  UnitTestResult,
  UnitAttribute,
  UnitInterdiction,
  AttributesInterdictionsDialogData,
  SampleCheckinDetailsDialogData,
} from './models/samples-query.model';
import { AttributesInterdictionsDialog } from './components/attributes-interdictions-dialog/attributes-interdictions-dialog';
import { SampleCheckinDetailsDialog } from './components/sample-checkin-details-dialog/sample-checkin-details-dialog';
import { ReportProgressDialog } from '@shared/components/report-progress-dialog/report-progress-dialog';
import { ReportProgressDialogData } from '@shared/components/report-progress-dialog/report-progress-dialog.model';

@Component({
  selector: 'app-samples-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    QuickLinks,
    SmartDropdownComponent,
  ],
  templateUrl: './samples-query.html',
  styleUrl: './samples-query.scss',
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: false } },
  ],
})
export class SamplesQueryComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly apiService = inject(SamplesQueryApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly stateService = inject(SamplesQueryStateService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('unitIdField') unitIdField!: UnitIdFieldComponent;
  private pendingUnitId: string | null = null;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
  };

  constructor() {
    // Defer header setup to avoid blocking constructor
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        // Check navigation state
        const navigationState = history.state;
        const fromBIPQ = !!navigationState?.fromBatchInProgressQuery;
        const fromCNRQC = !!navigationState?.fromConfirmatoryRelease;

        let breadcrumbs;
        if (fromBIPQ) {
          breadcrumbs = [
            { label: 'Home', link: '/home' },
            {
              label: 'Batch In-Progress Query',
              link: '/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-queries/batch-in-progress-query'
            },
            { label: pageData.title, link: null }
          ];
        } else if (fromCNRQC) {
          breadcrumbs = [
            { label: 'Home', link: '/home' },
            {
              label: 'Confirmatory Release Test Results',
              link: ROUTE_REGISTRY[RouteKey.ConfirmatoryReleaseTestResults].path
            },
            { label: pageData.title, link: null }
          ];
        } else {
          breadcrumbs = [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ];
        }

        this.headerConfig = {
          breadcrumbs,
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  filterForm: FormGroup = this.fb.group({
    osUnitId: [''],
    collDate: [null],
    receivedDate: [null],
    batchId: [''],
  });

  // Unit ID state (managed by app-unit-id-field)
  validatedUnitId: string | null = null;

  // Batch dropdown state
  batchOptions = signal<string[]>([]);
  batchDropdownItems = computed<DropdownItem[]>(() =>
    this.batchOptions().map(b => ({ code: b, description: b }))
  );
  selectedBatchId: string | null = null;
  isLoadingBatches = false;

  // Loading states
  isLoading = false;
  hasSearched = false;
  isLoadingDetails = false;

  // Results
  units: UnitRecord[] = [];
  totalRecords = 0;
  pageSize = 10;
  pageIndex = 0;
  sortColumn = 'CollDate';
  sortOrder = 'DESC';

  displayedColumns: string[] = [
    'unitId',
    'osUnitId',
    'collDate',
    'receivedDate',
    'batchId',
    'contractId',
    'company',
  ];

  // Selected unit detail
  selectedUnit = signal<UnitRecord | null>(null);
  unitDetails = signal<UnitDetailsResponse | null>(null);
  testResults = signal<UnitTestResult[]>([]);
  selectedTestResult = signal<UnitTestResult | null>(null);
  attributes = signal<UnitAttribute[]>([]);
  interdictions = signal<UnitInterdiction[]>([]);
  detailTabIndex = 0;
  contractExpanded = true;
  testSortDir: 'asc' | 'desc' = 'asc';

  readonly REACTIVE_CODES = new Set(['R', 'RR', 'P', 'IR', 'RP', 'RN']);

  get quickLinks(): QuickLink[] {
    const interCount = this.interdictions().length;
    const unit = this.selectedUnit();
    const hasBatchId = !!unit?.batchId;
    const hasTestBatch = this.testResults().some(tr => !!tr.tbId);
    const notes = this.unitDetails()?.noteIndicators;
    return [
      { id: 'unit-test-details', label: 'UNIT TEST DETAILS' },
      { id: 'attributes-interdictions', label: 'ATTRIBUTES AND INTERDICTIONS', count: interCount || undefined },
      { id: 'view-documents', label: 'VIEW DOCUMENTS', disabled: !(this.unitDetails()?.hasDocuments), tooltip: !(this.unitDetails()?.hasDocuments) ? 'No documents attached' : undefined },
      { id: 'notation', label: 'NOTATION', disabled: true, tooltip: 'Not available' },
      { id: 'general-information', label: 'GENERAL INFORMATION' },
      { id: 'sample-notes', label: 'SAMPLE NOTES', count: notes?.sampleNoteCount || undefined },
      { id: 'tbatch-notes', label: 'TBATCH NOTES', disabled: !hasTestBatch, tooltip: !hasTestBatch ? 'No test batch available' : undefined, count: notes?.tBatchNoteCount || undefined },
      { id: 'cbatch-notes', label: 'CBATCH NOTES', disabled: !hasBatchId, tooltip: !hasBatchId ? 'No batch ID available' : undefined, count: notes?.cBatchNoteCount || undefined },
      { id: 'test-notes', label: 'TEST NOTES', disabled: !this.testResults().some(t => t.auditKey), tooltip: !this.testResults().some(t => t.auditKey) ? 'No test results available' : undefined, count: notes?.testNoteCount || undefined },
      { id: 'general-notes', label: 'GENERAL NOTES' },
    ];
  }

  isReactive(result: string | null | undefined): boolean {
    if (!result) return false;
    return this.REACTIVE_CODES.has(result.toUpperCase());
  }

  sortedTestResults(): UnitTestResult[] {
    const results = [...this.testResults()];
    const dir = this.testSortDir === 'asc' ? 1 : -1;
    return results.sort((a, b) => {
      const aVal = (a.chapterId ?? '').toLowerCase();
      const bVal = (b.chapterId ?? '').toLowerCase();
      return aVal < bVal ? -dir : aVal > bVal ? dir : 0;
    });
  }

  toggleTestSort(): void {
    this.testSortDir = this.testSortDir === 'asc' ? 'desc' : 'asc';
  }

  ngOnInit(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClear();
      });

    const restored = this.stateService.restore();
    if (restored) {
      this.restoreState(restored);
    }

    // Read unit ID and collection date from query params
    this.pendingUnitId = this.route.snapshot.queryParamMap.get('unitId');
    const collDateParam = this.route.snapshot.queryParamMap.get('collDate');

    // If collection date is provided via query params, set it in the form
    if (collDateParam) {
      const collDateMoment = moment(collDateParam);
      if (collDateMoment.isValid()) {
        this.filterForm.patchValue({ collDate: collDateMoment });
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.pendingUnitId && this.unitIdField) {
      const unitId = this.pendingUnitId;
      this.pendingUnitId = null;

      // Ensure loading state is clear before starting
      this.isLoading = false;

      if (history.state?.alreadyParsed) {
        // Already-parsed 13-char unit ID from another screen — skip validation,
        // just display the value and call retrieve directly
        setTimeout(() => {
          this.unitIdField.setValue(unitId);
          this.validatedUnitId = unitId;
          this.onRetrieve();
        }, 0);
      } else {
        // Raw unit ID needs validation via the shared component
        setTimeout(() => {
          this.unitIdField.unitIdControl.setValue(unitId);
          this.unitIdField.onBlur();

          // Auto-retrieve results after unit ID validation
          setTimeout(() => {
            if (this.unitIdField?.isValid && !this.isLoading) {
              this.onRetrieve();
            }
          }, 300);
        }, 0);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRetrieve(): void {
    if (this.isLoading) {
      return;
    }

    if (!this.hasAnyCriteria()) {
      this.snackbarService.showError('Error 0903: At least one search criterion is required.');
      return;
    }
    this.pageIndex = 0;
    this.clearDetails();
    this.executeQuery();
  }

  onClear(): void {
    this.filterForm.reset({
      osUnitId: '',
      collDate: null,
      receivedDate: null,
      batchId: '',
    });
    this.validatedUnitId = null;
    this.selectedBatchId = null;
    this.batchOptions.set([]);
    if (this.unitIdField) {
      this.unitIdField.clear();
    }
    this.units = [];
    this.totalRecords = 0;
    this.pageIndex = 0;
    this.hasSearched = false;
    this.clearDetails();
  }

  onUnitValidated(data: UnitValidationResponse): void {
    this.validatedUnitId = data.parsedUnitId;
    if (data.collectionDate) {
      this.filterForm.patchValue({ collDate: moment(data.collectionDate) });
    }
    this.loadBatches();
    this.onRetrieve();
  }

  onUnitCleared(): void {
    this.validatedUnitId = null;
    this.selectedBatchId = null;
    this.filterForm.patchValue({ batchId: '', collDate: null });
    this.batchOptions.set([]);
  }

  onBatchSelectionChange(value: string | string[] | null): void {
    const batchId = typeof value === 'string' ? value : '';
    this.selectedBatchId = batchId || null;
    this.filterForm.patchValue({ batchId });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.executeQuery();
  }

  onSortChange(sort: Sort): void {
    if (!sort.active || sort.direction === '') {
      this.sortColumn = 'CollDate';
      this.sortOrder = 'DESC';
    } else {
      this.sortColumn = this.mapSortColumn(sort.active);
      this.sortOrder = sort.direction.toUpperCase();
    }
    this.pageIndex = 0;
    this.executeQuery();
  }

  onRowClick(unit: UnitRecord): void {
    this.selectedUnit.set(unit);
  }

  isRowSelected(unit: UnitRecord): boolean {
    return this.selectedUnit()?.unitId === unit.unitId;
  }

  onTestResultClick(tr: UnitTestResult): void {
    this.selectedTestResult.set(tr);
  }

  hasAnyCriteria(): boolean {
    const v = this.filterForm.value;
    return !!(this.validatedUnitId || v.osUnitId?.trim() || v.collDate || v.receivedDate || v.batchId?.trim());
  }

  hasAnyFieldValue(): boolean {
    const v = this.filterForm.value;
    return !!(this.validatedUnitId || v.osUnitId?.trim() || v.collDate || v.receivedDate || v.batchId?.trim());
  }

  formatDate(value: string | null | undefined): string {
    return formatTableDate(value);
  }

  formatDateTime(value: string | null | undefined): string {
    return formatTableDateTime(value);
  }

  formatChapterDateTime(value: string | null | undefined): string {
    if (!value) return '-';
    const m = moment.utc(value);
    if (!m.isValid()) return '-';
    const local = this.chapterTimezoneService.convertGmtToLocal(m);
    return local.format('DD-MMM-YYYY HH:mm').toUpperCase();
  }

  onQuickLinkClick(link: QuickLink): void {
    if (link.disabled || !this.selectedUnit()) return;

    switch (link.id) {
      case 'unit-test-details':
        this.submitReport('GERSAMPQ', 'Unit Test Details');
        break;
      case 'attributes-interdictions':
        this.openAttributesInterdictions();
        break;
      case 'view-documents':
        this.openViewDocuments();
        break;
      case 'general-information':
        this.submitReport('GERUNOTE', 'General Information');
        break;
      case 'sample-notes':
        this.openSampleNotes();
        break;
      case 'tbatch-notes':
        this.openTBatchNotes();
        break;
      case 'cbatch-notes':
        this.openCBatchNotes();
        break;
      case 'test-notes':
        this.openTestNotes();
        break;
      case 'general-notes':
        this.openGeneralNotes();
        break;
    }
  }

  private openViewDocuments(): void {
    const unit = this.selectedUnit();
    if (!unit) return;

    this.saveState();
    this.router.navigate(
      ['/system-administration/user-admin/lab-dist-user-admin/user-utilities/document-library'],
      {
        queryParams: { linkedTable: 'UNITS', linkedColumn: 'UNIT_ID', linkedValue: unit.unitId },
        state: { fromSamplesQuery: true },
      },
    );
  }

  openSampleCheckinDetails(): void {
    const unit = this.selectedUnit();
    if (!unit) return;

    this.dialog.open(SampleCheckinDetailsDialog, {
      width: '900px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: { unitId: unit.unitId } as SampleCheckinDetailsDialogData,
    });
  }

  openAttributesInterdictions(): void {
    const unit = this.selectedUnit();
    if (!unit) return;

    this.dialog.open(AttributesInterdictionsDialog, {
      width: '1000px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: {
        unitId: unit.unitId,
        attributes: this.attributes(),
        interdictions: this.interdictions(),
      } as AttributesInterdictionsDialogData,
    });
  }

  openSampleNotes(): void {
    const unit = this.selectedUnit();
    if (!unit) return;

    if (!unit.collDate) {
      this.snackbarService.showError('Collection Date is required to view sample notes');
      return;
    }

    this.apiService.getSampleNotes(unit.unitId, unit.collDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const notes = response.data ?? [];
          const dialogRef = this.dialog.open(GenericNotesDialog, {
            width: '600px',
            height: 'calc(100vh - 64px)',
            maxWidth: '100vw',
            maxHeight: 'calc(100vh - 64px)',
            disableClose: false,
            panelClass: 'code-dialog-panel-right',
            position: { right: '0', top: '64px' },
            hasBackdrop: true,
            backdropClass: 'code-dialog-backdrop',
            data: {
              title: 'Sample Notes',
              contextLabel: 'UNIT ID',
              contextValue: unit.unitId,
              notes,
            } as GenericNotesDialogData,
          });
          dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => this.refreshNoteCounts());
        },
        error: () => this.snackbarService.showError('Failed to load sample notes.'),
      });
  }

  openTBatchNotes(): void {
    const unit = this.selectedUnit();
    if (!unit) return;

    const selectedTr = this.selectedTestResult();
    const tr = selectedTr?.tbId ? selectedTr : this.testResults().find(t => !!t.tbId);
    if (!tr?.tbId) return;

    const dialogRef = this.dialog.open(TestBatchNotesDialog, {
      width: '600px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: {
        worksheetId: tr.tbId,
        testId: tr.testId,
      } as TestBatchNotesDialogData,
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => this.refreshNoteCounts());
  }

  openCBatchNotes(): void {
    const unit = this.selectedUnit();
    if (!unit?.batchId) return;

    this.apiService.getCheckinNotes(unit.batchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const notes = response.data ?? [];
          const dialogRef = this.dialog.open(GenericNotesDialog, {
            width: '600px',
            height: 'calc(100vh - 64px)',
            maxWidth: '100vw',
            maxHeight: 'calc(100vh - 64px)',
            disableClose: false,
            panelClass: 'code-dialog-panel-right',
            position: { right: '0', top: '64px' },
            hasBackdrop: true,
            backdropClass: 'code-dialog-backdrop',
            data: {
              title: 'CBatch Notes',
              contextLabel: 'CHECK IN BATCH ID',
              contextValue: unit.batchId,
              notes,
            } as GenericNotesDialogData,
          });
          dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => this.refreshNoteCounts());
        },
        error: () => this.snackbarService.showError('Failed to load check-in batch notes.'),
      });
  }

  openTestNotes(): void {
    const unit = this.selectedUnit();
    if (!unit) return;

    const selectedTr = this.selectedTestResult() ?? this.testResults()[0];
    if (!selectedTr?.testId || !selectedTr.auditKey) {
      this.snackbarService.showError('No test results available for notes.');
      return;
    }

    this.apiService.getTestNotes(unit.unitId, selectedTr.testId, selectedTr.auditKey)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const notes = response.data ?? [];
          const dialogRef = this.dialog.open(GenericNotesDialog, {
            width: '600px',
            height: 'calc(100vh - 64px)',
            maxWidth: '100vw',
            maxHeight: 'calc(100vh - 64px)',
            disableClose: false,
            panelClass: 'code-dialog-panel-right',
            position: { right: '0', top: '64px' },
            hasBackdrop: true,
            backdropClass: 'code-dialog-backdrop',
            data: {
              title: `Test Notes - ${selectedTr.testId}`,
              contextLabel: 'UNIT ID',
              contextValue: unit.unitId,
              notes,
            } as GenericNotesDialogData,
          });
          dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => this.refreshNoteCounts());
        },
        error: () => this.snackbarService.showError('Failed to load test notes.'),
      });
  }

  openGeneralNotes(): void {
    const unit = this.selectedUnit();
    if (!unit) return;

    if (!unit.collDate) {
      this.snackbarService.showError('Collection Date is required to view general notes');
      return;
    }

    const dialogRef = this.dialog.open(DonationNotesDialog, {
      width: '600px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: {
        unitId: unit.unitId,
        collectionDate: unit.collDate,
        context: 'RGITUBES', // Route to RGT_TUBES table for regional samples
      } as DonationNotesDialogData,
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => this.refreshNoteCounts());
  }

  private submitReport(reportName: string, reportTitle: string): void {
    const unit = this.selectedUnit();
    if (!unit) return;

    this.dialog.open(ReportProgressDialog, {
      width: '420px',
      disableClose: true,
      data: { reportName, unitId: unit.unitId, reportTitle } as ReportProgressDialogData,
    });
  }

  private executeQuery(): void {
    const v = this.filterForm.value;

    const request: SamplesQuerySearchRequest = {
      unitId: this.validatedUnitId || null,
      osUnitId: v.osUnitId?.trim() || null,
      collDate: v.collDate ? this.formatDateForApi(v.collDate) : null,
      receivedDate: v.receivedDate ? this.formatDateForApi(v.receivedDate) : null,
      batchId: v.batchId || null,
      sortColumn: this.sortColumn,
      sortOrder: this.sortOrder,
    };

    this.isLoading = true;
    this.hasSearched = true;

    // Safety timeout: Force clear loading after 30 seconds if request hangs
    const loadingTimeout = setTimeout(() => {
      if (this.isLoading) {
        console.warn('[SamplesQuery] Loading timeout - forcing loading state to clear');
        this.isLoading = false;
        this.snackbarService.showError('Request timed out. Please try again.');
      }
    }, 30000);

    const skip = this.pageIndex * this.pageSize;

    this.apiService.search(request, this.pageSize, skip)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          clearTimeout(loadingTimeout);
          this.isLoading = false;
          if (response.success && response.data) {
            this.units = response.data;
            this.totalRecords = response.total ?? response.data.length;

            if (this.units.length > 0) {
              const firstUnit = this.units[0];
              this.selectedUnit.set(firstUnit);
              this.loadUnitDetails(firstUnit.unitId);
              this.autoPopulateFilterFields(firstUnit);
            }
          } else {
            this.units = [];
            this.totalRecords = 0;
            if (response.errorResponse?.error) {
              this.snackbarService.showError(
                response.errorResponse.errorCode
                  ? `Error ${response.errorResponse.errorCode}: ${response.errorResponse.error}`
                  : response.errorResponse.error,
              );
            } else if (response.message) {
              this.snackbarService.showError(response.message);
            }
          }
        },
        error: (error) => {
          clearTimeout(loadingTimeout);
          this.isLoading = false;
          this.units = [];
          this.totalRecords = 0;
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'An error occurred while searching samples.'),
          );
        },
      });
  }

  private loadUnitDetails(unitId: string): void {
    this.isLoadingDetails = true;

    this.apiService.getUnitDetails(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingDetails = false;
          const details = response.data ?? response.item;
          if (response.success && details) {
            this.unitDetails.set(details);
            const tests = details.testResults ?? [];
            this.testResults.set(tests);
            this.selectedTestResult.set(tests.length > 0 ? tests[0] : null);
            this.attributes.set(details.attributes ?? []);
            this.interdictions.set(details.interdictions ?? []);
          } else {
            this.clearDetails();
          }
        },
        error: () => {
          this.isLoadingDetails = false;
          this.clearDetails();
        },
      });
  }

  private loadBatches(): void {
    this.isLoadingBatches = true;
    this.apiService.getBatches()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingBatches = false;
          if (response.success && response.data) {
            this.batchOptions.set(response.data);
          }
        },
        error: () => {
          this.isLoadingBatches = false;
          this.batchOptions.set([]);
        },
      });
  }

  private autoPopulateFilterFields(firstUnit: UnitRecord): void {
    const formValue = this.filterForm.value;
    if (!formValue.collDate && firstUnit.collDate) {
      this.filterForm.patchValue({ collDate: moment(firstUnit.collDate) });
    }

    if (!formValue.osUnitId?.trim() && firstUnit.osUnitId) {
      this.filterForm.patchValue({ osUnitId: firstUnit.osUnitId });
    }

    const distinctBatches = new Set(this.units.map(u => u.batchId).filter(Boolean));
    if (!formValue.batchId?.trim() && distinctBatches.size === 1) {
      const batchId = [...distinctBatches][0]!;
      this.filterForm.patchValue({ batchId });
      this.selectedBatchId = batchId;
    }
  }

  private clearDetails(): void {
    this.selectedUnit.set(null);
    this.unitDetails.set(null);
    this.testResults.set([]);
    this.selectedTestResult.set(null);
    this.attributes.set([]);
    this.interdictions.set([]);
    this.detailTabIndex = 0;
  }

  private refreshNoteCounts(): void {
    const unit = this.selectedUnit();
    if (!unit) return;

    this.apiService.getNoteCounts(unit.unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.item) {
            const current = this.unitDetails();
            if (current) {
              this.unitDetails.set({
                ...current,
                noteIndicators: response.item,
                hasNotes: response.item.sampleNoteCount > 0 ||
                  response.item.tBatchNoteCount > 0 ||
                  response.item.cBatchNoteCount > 0 ||
                  response.item.testNoteCount > 0,
              });
            }
          }
        },
      });
  }

  private formatDateForApi(date: any): string {
    if (!date) return '';
    const m = date.format ? date : null;
    if (m) return m.format('MM-DD-YYYY');
    if (date instanceof Date) {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${month}-${day}-${date.getFullYear()}`;
    }
    return String(date);
  }

  private saveState(): void {
    this.stateService.save({
      filterFormValues: { ...this.filterForm.value },
      validatedUnitId: this.validatedUnitId,
      selectedBatchId: this.selectedBatchId,
      batchOptions: this.batchOptions(),
      units: this.units,
      totalRecords: this.totalRecords,
      pageSize: this.pageSize,
      pageIndex: this.pageIndex,
      sortColumn: this.sortColumn,
      sortOrder: this.sortOrder,
      hasSearched: this.hasSearched,
      selectedUnit: this.selectedUnit(),
      unitDetails: this.unitDetails(),
      testResults: this.testResults(),
      attributes: this.attributes(),
      interdictions: this.interdictions(),
      contractExpanded: this.contractExpanded,
      testSortDir: this.testSortDir,
    });
  }

  private restoreState(state: import('./services/samples-query-state.service').SamplesQuerySavedState): void {
    this.filterForm.patchValue(state.filterFormValues, { emitEvent: false });
    this.validatedUnitId = state.validatedUnitId;
    this.selectedBatchId = state.selectedBatchId;
    this.batchOptions.set(state.batchOptions);
    this.units = state.units;
    this.totalRecords = state.totalRecords;
    this.pageSize = state.pageSize;
    this.pageIndex = state.pageIndex;
    this.sortColumn = state.sortColumn;
    this.sortOrder = state.sortOrder;
    this.hasSearched = state.hasSearched;
    this.selectedUnit.set(state.selectedUnit);
    this.unitDetails.set(state.unitDetails);
    this.testResults.set(state.testResults);
    this.attributes.set(state.attributes);
    this.interdictions.set(state.interdictions);
    this.contractExpanded = state.contractExpanded;
    this.testSortDir = state.testSortDir;
  }

  private mapSortColumn(columnKey: string): string {
    const map: Record<string, string> = {
      unitId: 'UnitId',
      collDate: 'CollDate',
      receivedDate: 'ReceivedDate',
      batchId: 'BatchId',
    };
    return map[columnKey] ?? 'CollDate';
  }
}
