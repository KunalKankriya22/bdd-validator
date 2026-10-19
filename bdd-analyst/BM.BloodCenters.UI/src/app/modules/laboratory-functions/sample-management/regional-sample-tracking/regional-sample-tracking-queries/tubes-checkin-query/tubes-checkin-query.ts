import { Component, OnInit, OnDestroy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';

import { TubesCheckinQueryApiService } from './services/tubes-checkin-query-api.service';
import {
  ContractOption,
  BatchOption,
  TubeCheckinRecord,
  ProfileTest,
  AdditionalTest,
} from './models/tubes-checkin-query.model';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { UnitIdFormatUtility } from '@shared/components/unit-id-field/unit-id-format.utility';
import moment from 'moment';
import { TubesNotesPanelComponent } from './tubes-notes-panel/tubes-notes-panel';

@Component({
  selector: 'app-tubes-checkin-query',
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
    MatTooltipModule,
    MatDatepickerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    TubesNotesPanelComponent,
  ],
  providers: [
    TubesCheckinQueryApiService,
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: false } },
  ],
  templateUrl: './tubes-checkin-query.html',
  styleUrl: './tubes-checkin-query.scss',
})
export class TubesCheckinQueryComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(TubesCheckinQueryApiService);
  private readonly snackbarService: SnackbarService = inject(SnackbarService);
  private readonly headerService: HeaderService = inject(HeaderService);
  private readonly pageHeaderService: PageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService: ChapterTimezoneService = inject(ChapterTimezoneService);
  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  filterForm: FormGroup = this.fb.group({
    contractId: ['', Validators.required],
    tubeDate: [null, this.futureDateValidator()],
    batchId: [''],
  });

  contractOptions = signal<ContractOption[]>([]);
  batchOptions = signal<BatchOption[]>([]);

  contractSearchCtrl = new FormControl('');
  batchSearchCtrl = new FormControl('');

  contractSearch = signal('');
  batchSearch = signal('');

  filteredContracts = computed(() => this.filterContractOptions(this.contractOptions(), this.contractSearch()));
  filteredBatches = computed(() => this.filterBatchOptions(this.batchOptions(), this.batchSearch()));

  companyDescription = signal('');
  centerId = signal('');
  profileSetId = signal('');
  unitCount = signal('');

  selectedRecord: TubeCheckinRecord | null = null;
  profileTests = signal<ProfileTest[]>([]);
  additionalTests = signal<AdditionalTest[]>([]);

  isLoadingContracts = false;
  isLoadingBatches = false;
  isLoading = false;
  hasSearched = false;

  dataSource: TubeCheckinRecord[] = [];
  sortColumn = 'UnitId';
  sortOrder = 'ASC';

  tableConfig: DataTableConfig<TubeCheckinRecord> = {
    columns: this.getTableColumns(),
    rowActions: this.getRowActions(),
    pagination: {
      pageSize: 1000,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [],
      showFirstLastButtons: false
    },
    sortConfig: {
      column: 'unitId',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No tubes found matching your search criteria.',
    noDataIcon: 'search',
    loadingMessage: 'Loading tubes...',
    showPagination: false
  };

  notesPanelOpen = false;
  selectedBatchForNotes: string | null = null;
  selectedContractForNotes: string | null = null;

  tubeDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTubeDateError()
  );

  ngOnInit(): void {
    this.loadContracts();

    this.contractSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.contractSearch.set(v || ''));

    this.batchSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.batchSearch.set(v || ''));

    this.filterForm.get('contractId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((contractId: string) => {
        this.filterForm.patchValue({ tubeDate: null, batchId: '' }, { emitEvent: false });
        this.batchOptions.set([]);
        this.batchSearchCtrl.setValue('');
        this.resetResultFields();

        if (contractId) {
          const selected = this.contractOptions().find(c => c.contractId === contractId);
          if (selected) {
            this.companyDescription.set(selected.company);
            // centerId and profileSetId are only populated from query response
          }
          this.loadBatches(contractId);
        }
      });

    this.filterForm.get('tubeDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const contractId = this.filterForm.get('contractId')?.value;
        if (contractId) {
          this.filterForm.patchValue({ batchId: '' }, { emitEvent: false });
          this.batchSearchCtrl.setValue('');
          this.loadBatches(contractId);
        }
      });

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadContracts();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getTableColumns(): TableColumn<TubeCheckinRecord>[] {
    const count = this.dataSource.length;
    return [
      {
        key: 'unitId',
        header: `Unit ID (${count})`,
        sortable: false,
        width: '140px',
        valueFormatter: (value, row) => this.formatUnitId(row)
      },
      {
        key: 'batchId',
        header: 'Batch ID',
        sortable: false,
        width: '100px'
      },
      {
        key: 'checkinDate',
        header: 'Check-In Date',
        sortable: false,
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'red1Flag',
        header: 'Red 1 Tube',
        sortable: false,
        width: '60px',
        valueFormatter: (value) => this.formatTubeFlag(value)
      },
      {
        key: 'red2Flag',
        header: 'Red 2 Tube',
        sortable: false,
        width: '60px',
        valueFormatter: (value) => this.formatTubeFlag(value)
      },
      {
        key: 'purple1Flag',
        header: 'Purple 1 Tube',
        sortable: false,
        width: '60px',
        valueFormatter: (value) => this.formatTubeFlag(value)
      },
      {
        key: 'purple2Flag',
        header: 'Purple 2 Tube',
        sortable: false,
        width: '60px',
        valueFormatter: (value) => this.formatTubeFlag(value)
      },
    ];
  }

  private getRowActions(): RowAction<TubeCheckinRecord>[] {
    return [
      {
        iconSvg: 'assets/images/icons/message.svg',
        label: 'View Notes',
        ariaLabel: 'View notes for this batch',
        action: 'notes',
        color: 'default'
      }
    ];
  }

  onRetrieve(): void {
    this.filterForm.markAllAsTouched();

    // FMB Validation: Contract ID required (Error 0080)
    const contractId = this.filterForm.get('contractId')?.value;
    if (!contractId) {
      this.snackbarService.showError('Error 0080: Contract ID is required');
      return;
    }

    // FMB Validation: Check-in date cannot be future (Error 1010)
    const tubeDate = this.filterForm.get('tubeDate')?.value;
    if (tubeDate && this.isFutureDate(tubeDate)) {
      this.snackbarService.showError('Error 1010: Check-in date cannot be in the future');
      return;
    }

    this.executeQuery();
  }

  onDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    DateFieldValidationUtility.handleEndDateInput(
      inputValue,
      this.filterForm.get('tubeDate'),
      false // not edit mode
    );
  }

  onDateBlur(): void {
    const tubeDateControl = this.filterForm.get('tubeDate');
    if (tubeDateControl) {
      tubeDateControl.markAsTouched();
      tubeDateControl.updateValueAndValidity();
    }
  }

  getTubeDateError(): string {
    const control = this.filterForm.get('tubeDate');
    if (!control || !(control.touched || control.dirty)) {
      return '';
    }

    if (control.hasError('matDatepickerParse') || control.hasError('invalidDate')) {
      return 'Invalid date format';
    }

    if (control.hasError('futureDate')) {
      return 'Date cannot be in the future';
    }

    return '';
  }

  onClearAll(): void {
    this.filterForm.reset({ contractId: '', tubeDate: null, batchId: '' });
    this.contractSearchCtrl.setValue('');
    this.batchSearchCtrl.setValue('');
    this.resetResultFields();
    this.dataSource = [];
    this.hasSearched = false;
    this.selectedRecord = null;
    this.profileTests.set([]);
    this.additionalTests.set([]);
  }

  onSortChange(event: TableSortEvent): void {
    if (!event.column || event.direction === 'default') {
      this.sortColumn = 'UnitId';
      this.sortOrder = 'ASC';
    } else {
      this.sortColumn = this.mapSortColumn(event.column);
      this.sortOrder = event.direction.toUpperCase();
    }
    this.executeQuery();
  }

  onRowAction(event: TableRowActionEvent<TubeCheckinRecord>): void {
    if (event.action === 'notes') {
      this.openNotesPanel(event.row);
    }
  }

  onRowClick(record: TubeCheckinRecord): void {
    this.selectedRecord = record;
    this.loadProfileTests(record);
    this.loadAdditionalTests(record);
  }

  openNotesPanel(record: TubeCheckinRecord): void {
    const contractId = this.filterForm.get('contractId')?.value;
    if (record.batchId && contractId) {
      this.selectedBatchForNotes = record.batchId;
      this.selectedContractForNotes = contractId;
      this.notesPanelOpen = true;
    }
  }

  closeNotesPanel(): void {
    this.notesPanelOpen = false;
    this.selectedBatchForNotes = null;
    this.selectedContractForNotes = null;
  }

  onNotesDataChanged(): void {}

  formatTubeFlag(value: string | null | undefined): string {
    if (!value || value === '-') return '-';
    if (value === 'Y' || value.toLowerCase() === 'yes') return 'Yes';
    return '-';
  }

  formatUnitId(record: TubeCheckinRecord): string {
    if (!record.unitId) return '';

    if (record.checkDigit) {
      return `${record.unitId}-${record.checkDigit}`;
    }

    const checkDigit = UnitIdFormatUtility.calculateISBTCheckDigit(record.unitId);
    return `${record.unitId}${checkDigit}`;
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';
    try {
      const gmtMoment = moment.utc(date instanceof Date ? date.toISOString() : date);
      if (!gmtMoment.isValid()) return '-';
      const localMoment = this.chapterTimezoneService.convertGmtToLocal(gmtMoment);
      return localMoment.format('DD-MMM-YYYY HH:mm').toUpperCase();
    } catch {
      return '-';
    }
  }

  private loadContracts(): void {
    this.isLoadingContracts = true;
    this.apiService.getContracts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingContracts = false;
          if (response.success && response.data) {
            this.contractOptions.set(response.data);
          } else {
            this.contractOptions.set([]);
          }
        },
        error: (error) => {
          this.isLoadingContracts = false;
          this.contractOptions.set([]);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'Failed to load contracts.')
          );
        },
      });
  }

  private loadBatches(contractId: string): void {
    const tubeDate = this.filterForm.get('tubeDate')?.value;
    const tubeDateStr = tubeDate ? this.formatDateForApi(tubeDate) : undefined;

    this.isLoadingBatches = true;
    this.apiService.getBatches(contractId, tubeDateStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingBatches = false;
          if (response.success && response.data) {
            this.batchOptions.set(response.data);
          } else {
            this.batchOptions.set([]);
            if (response.errorCode || response.errorResponse) {
              this.snackbarService.showError(
                response.errorResponse?.error ?? response.message ?? 'Failed to load batches.'
              );
            }
          }
        },
        error: (error) => {
          this.isLoadingBatches = false;
          this.batchOptions.set([]);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'Failed to load batches.')
          );
        },
      });
  }

  private loadProfileTests(record: TubeCheckinRecord): void {
    if (!record.profileSetId) {
      this.profileTests.set([]);
      return;
    }

    const contractId = this.filterForm.get('contractId')?.value;
    if (!contractId) return;

    const profileSeqNo = record.profileSeqNo ?? 1;

    this.apiService.getProfileTests(contractId, record.profileSetId, profileSeqNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.profileTests.set(response.data);
          } else {
            this.profileTests.set([]);
          }
        },
        error: () => {
          this.profileTests.set([]);
        },
      });
  }

  private loadAdditionalTests(record: TubeCheckinRecord): void {
    // Backend endpoint: GET additional-tests/{cbcUnitId}?profileSetId=&tubeProfileSetId=
    const cbcUnitId = record.cbcUnitId || record.unitId;

    this.apiService.getAdditionalTests(
      cbcUnitId,
      record.profileSetId || undefined,
      record.tubeProfileSetId || undefined
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.additionalTests.set(response.data);
          } else {
            this.additionalTests.set([]);
          }
        },
        error: () => {
          this.additionalTests.set([]);
        },
      });
  }

  private executeQuery(): void {
    const contractId = this.filterForm.get('contractId')?.value;
    const tubeDate = this.filterForm.get('tubeDate')?.value;
    const batchId = this.filterForm.get('batchId')?.value;

    this.isLoading = true;
    this.hasSearched = true;

    const tubeDateStr = tubeDate ? this.formatDateForApi(tubeDate) : null;

    this.apiService.query(
      contractId || '',
      tubeDateStr,
      batchId || null,
      1000,
      0,
      this.sortColumn,
      this.sortOrder
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success && response.data) {
            const data = response.data;

            // FMB Validation: Check if any units found (Error 1011)
            if (!data.tubes || data.tubes.length === 0 || data.unitCount === 0) {
              this.dataSource = [];
              this.unitCount.set(String(data.unitCount ?? 0));
              this.tableConfig = {
                ...this.tableConfig,
                columns: this.getTableColumns()
              };
              this.snackbarService.showError('Error 1011: No units found for the selected criteria');
              return;
            }

            this.dataSource = data.tubes;
            this.unitCount.set(String(data.unitCount ?? this.dataSource.length));

            this.tableConfig = {
              ...this.tableConfig,
              columns: this.getTableColumns()
            };

            if (data.companyName) {
              this.companyDescription.set(data.companyName);
            }
            if (data.centerId) {
              this.centerId.set(data.centerId);
            }
            if (data.profileSetId) {
              this.profileSetId.set(data.profileSetId);
            }

            // Auto-select first row (FMB behavior)
            if (this.dataSource.length > 0) {
              this.onRowClick(this.dataSource[0]);
            }
          } else {
            this.dataSource = [];
            this.snackbarService.showError(
              response.errorResponse?.error ?? response.message ?? 'Failed to retrieve data.'
            );
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.dataSource = [];
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'An error occurred while retrieving tubes.')
          );
        },
      });
  }

  private resetResultFields(): void {
    this.companyDescription.set('');
    this.centerId.set('');
    this.profileSetId.set('');
    this.unitCount.set('');
  }

  private futureDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const inputDate = moment.isMoment(control.value) ? control.value : moment(control.value);
      const chapterToday = this.chapterTimezoneService.getChapterLocalDate();

      // Compare dates at day level (ignore time)
      if (inputDate.clone().startOf('day').isAfter(chapterToday.clone().startOf('day'))) {
        return { futureDate: true };
      }

      return null;
    };
  }

  private isFutureDate(date: Date | moment.Moment): boolean {
    const inputDate = moment.isMoment(date) ? date : moment(date);
    const chapterToday = this.chapterTimezoneService.getChapterLocalDate();

    // Compare dates at day level (ignore time)
    return inputDate.clone().startOf('day').isAfter(chapterToday.clone().startOf('day'));
  }

  private formatDateForApi(date: Date | moment.Moment): string {
    const m = moment.isMoment(date) ? date : moment(date);
    return m.format('MM-DD-YYYY');
  }

  private mapSortColumn(columnKey: string): string {
    const mapping: Record<string, string> = {
      'unitId': 'UnitId',
      'batchId': 'BatchId',
      'checkinDate': 'CheckinDate',
    };
    return mapping[columnKey] || 'UnitId';
  }

  private filterContractOptions(options: ContractOption[], search: string): ContractOption[] {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o =>
      o.contractId?.toLowerCase().includes(q) ||
      o.company?.toLowerCase().includes(q),
    );
  }

  private filterBatchOptions(options: BatchOption[], search: string): BatchOption[] {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o => o.batchId?.toLowerCase().includes(q));
  }

}
