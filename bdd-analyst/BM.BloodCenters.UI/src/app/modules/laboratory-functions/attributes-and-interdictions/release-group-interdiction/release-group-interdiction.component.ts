import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil, filter } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

import { ViewUnitsDialogComponent, ViewUnitsDialogData } from './view-units-dialog/view-units-dialog.component';
import { ReleaseGroupInterdictionService } from './services/release-group-interdiction.service';
import {
  ReleaseGroupInterdictionDto,
  ReleaseGroupInterdictionQueryDto,
  DriveDropdownItem,
  BatchDropdownItem,
  CollectionDateDropdownItem,
  LotNumberDropdownItem,
  TbIdDropdownItem,
  SearchMode,
  SEARCH_MODE_OPTIONS,
  SEARCH_MODE_TO_SOURCE_TEST_ID,
  VALIDATION,
} from './models/release-group-interdiction.models';

@Component({
  selector: 'app-release-group-interdiction',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar,
  ],
  templateUrl: './release-group-interdiction.component.html',
  styleUrls: ['./release-group-interdiction.component.scss'],
})
export class ReleaseGroupInterdictionComponent implements OnInit, OnDestroy {
  private readonly service = inject(ReleaseGroupInterdictionService);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  readonly headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Release Group Interdiction or Hold' },
    ],
    title: 'Release Group Interdiction or Hold',
    subtitle: 'Release an interdiction or Hold that has been placed on group level.',
  };

  readonly tableConfig: DataTableConfig<ReleaseGroupInterdictionDto> = {
    columns: [
      { key: 'interCode', header: 'Interdiction Code', width: '20%' },
      { key: 'interDesc', header: 'Description', width: '50%' },
      { key: 'interType', header: 'Interdiction Type', width: '30%' },
    ],
    enableSelection: true,
    selectionKey: 'interCode',
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No interdictions found',
    emptySubMessage: 'Enter Mode to begin.',
  };

  readonly searchConfig: SearchBarConfig = {
    placeholder: 'Search by Interdiction Code',
    minLength: 1,
    searchOnEnterOnly: true,
  };

  readonly searchModeOptions = SEARCH_MODE_OPTIONS;

  readonly searchModeControl = new FormControl<SearchMode | null>(null, {
    validators: [Validators.required],
  });
  readonly searchValueControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  readonly searchForm = new FormGroup({
    searchMode: this.searchModeControl,
    searchValue: this.searchValueControl,
  });

  // State — raw API response (per-unit rows)
  private allResults = signal<ReleaseGroupInterdictionDto[]>([]);

  // Deduplicated for table display (distinct interCode/interDesc/interType)
  interdictions = computed(() => {
    const raw = this.allResults();
    const seen = new Map<string, ReleaseGroupInterdictionDto>();
    for (const row of raw) {
      if (!seen.has(row.interCode)) {
        seen.set(row.interCode, row);
      }
    }
    return Array.from(seen.values());
  });

  totalCount = signal(0);
  isLoading = signal(false);
  isLoadingDropdown = signal(false);
  hasSearched = signal(false);
  searchTerm = signal('');
  searchMode = signal<SearchMode>('DRIVE');

  selectedRows = signal<ReleaseGroupInterdictionDto[]>([]);

  driveOptions = signal<DriveDropdownItem[]>([]);
  batchOptions = signal<BatchDropdownItem[]>([]);
  collectionDateOptions = signal<CollectionDateDropdownItem[]>([]);
  lotNumberOptions = signal<LotNumberDropdownItem[]>([]);
  tbIdOptions = signal<TbIdDropdownItem[]>([]);

  isReleasing = signal(false);


  currentSourceTestId = computed(() => SEARCH_MODE_TO_SOURCE_TEST_ID[this.searchMode()]);

  currentFilterValue = computed(() => this.searchValueControl.value.trim());

  searchValueMaxLength = computed(() => {
    const mode = this.searchMode();
    switch (mode) {
      case 'DRIVE': return VALIDATION.DRIVE_ID_MAX_LENGTH;
      case 'BATCH': return VALIDATION.BATCH_ID_MAX_LENGTH;
      case 'LOT': return VALIDATION.LOT_NUMBER_MAX_LENGTH;
      case 'TB_ID': return VALIDATION.TB_ID_MAX_LENGTH;
      case 'ITBID': return VALIDATION.ITBID_MAX_LENGTH;
      default: return 20;
    }
  });

  filteredInterdictions = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const rows = this.interdictions();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.interCode?.toLowerCase().includes(term) ||
        r.interDesc?.toLowerCase().includes(term),
    );
  });

  canRelease = computed(() =>
    this.selectedRows().length > 0 && !this.isReleasing(),
  );

  private static readonly FETCH_SIZE = 1000;

  ngOnInit(): void {
    this.setupFormSubscriptions();
    this.subscribeToChapterChanges();
    // Do NOT pre-load — value field is hidden until user explicitly selects a mode
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchModeChange(mode: SearchMode): void {
    this.searchMode.set(mode);
    this.searchValueControl.reset('');
    this.searchValueControl.markAsUntouched();
    this.allResults.set([]);
    this.totalCount.set(0);
    this.hasSearched.set(false);
    this.selectedRows.set([]);

    this.driveOptions.set([]);
    this.batchOptions.set([]);
    this.collectionDateOptions.set([]);
    this.lotNumberOptions.set([]);
    this.tbIdOptions.set([]);

    this.loadDropdownForMode(mode);
  }

  onAutocompleteSelected(value: string): void {
    this.searchValueControl.setValue(value, { emitEvent: false });
    this.onSearch();
  }

  onSearch(): void {
    const rawValue = this.searchValueControl.value.trim();
    if (!rawValue) {
      this.searchValueControl.markAsTouched();
      this.focusSearchValueField();
      return;
    }

    const value = this.searchMode() === 'ITBID' ? rawValue.toUpperCase() : rawValue;
    const mode = this.searchMode();

    // FMB CTRL_BLK_5.TB_ID VALIDATE_FIELD: SUBSTR(tb_id, 8, 2) must = 'TB' for TB ID mode
    if (mode === 'TB_ID' && value.length >= 9 && value.substring(7, 9) !== 'TB') {
      this.snackbarService.showError('Error 1223: Invalid TB ID — characters 8-9 must be \'TB\'. Use Instrument TB ID mode instead.');
      return;
    }

    // FMB CTRL_BLK_7.INT_TB_ID VALIDATE_FIELD: SUBSTR(int_tb_id, 8, 2) must NOT = 'TB' for ITBID mode
    if (mode === 'ITBID' && value.length >= 9 && value.substring(7, 9) === 'TB') {
      this.snackbarService.showError('Error 1223: Instrument TB ID must not have \'TB\' at position 8-9. Use TB ID mode instead.');
      return;
    }

    this.searchTerm.set('');
    this.isLoading.set(true);
    this.hasSearched.set(true);
    this.selectedRows.set([]);

    const sourceTestId = this.currentSourceTestId();
    const query: ReleaseGroupInterdictionQueryDto = { sourceTestId };

    switch (mode) {
      case 'DRIVE':
        query.driveId = value;
        break;
      case 'BATCH':
        query.batchId = value;
        break;
      case 'COLL_DATE':
        query.collectionDate = value;
        break;
      case 'LOT':
        query.lotNumber = value;
        break;
      case 'TB_ID':
        query.tbId = value;
        break;
      case 'ITBID':
        query.tbId = value;
        break;
    }

    this.service
      .getAll(ReleaseGroupInterdictionComponent.FETCH_SIZE, 0, query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.allResults.set(result.data);
          this.totalCount.set(result.totalCount);
          this.isLoading.set(false);

          if (result.data.length === 0) {
            const modeMessages: Record<SearchMode, string> = {
              DRIVE: 'Drive has no interdictions',
              BATCH: 'Batch has no interdictions',
              COLL_DATE: 'Collection date has no interdictions',
              LOT: 'Lot has no interdictions',
              TB_ID: 'TB ID has no interdictions',
              ITBID: 'Instrument TB ID has no interdictions',
            };
            this.snackbarService.showError(modeMessages[mode]);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.allResults.set([]);
          this.totalCount.set(0);

          const errorCode = err?.error?.errorCode || err?.error?.errorResponse?.errorCode || '';
          const errorMsg = err?.error?.message || err?.error?.errorResponse?.error || 'Invalid value';
          const displayMsg = errorCode ? `Error:${errorCode} ${errorMsg}` : errorMsg;
          this.showValidationWarning(displayMsg);
        },
      });
  }

  clearAll(): void {
    this.searchForm.reset({ searchMode: null, searchValue: '' });
    this.searchValueControl.markAsUntouched();
    this.searchMode.set('DRIVE');
    this.allResults.set([]);
    this.totalCount.set(0);
    this.hasSearched.set(false);
    this.searchTerm.set('');
    this.selectedRows.set([]);

    this.driveOptions.set([]);
    this.batchOptions.set([]);
    this.collectionDateOptions.set([]);
    this.lotNumberOptions.set([]);
    this.tbIdOptions.set([]);
  }

  onFilterSearch(term: string): void {
    this.searchTerm.set(term);
  }

  onSelectionChange(selected: ReleaseGroupInterdictionDto[]): void {
    this.selectedRows.set(selected);
  }

  onRelease(): void {
    const selected = this.selectedRows();
    if (selected.length === 0) return;

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      ariaLabel: 'Release Group Interdiction Confirmation',
      data: {
        title: 'Release Group Interdiction',
        message: `Do you want to release ${selected.length} selected interdiction(s)?`,
        confirmText: 'YES',
        cancelText: 'NO',
      } as ConfirmActionDialogData,
    });

    dialogRef.afterClosed()
      .pipe(
        filter(result => result === true),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.executeRelease(selected);
      });
  }

  onViewUnits(): void {
    const controlMode = this.currentSourceTestId();
    const filterValue = this.currentFilterValue();
    if (!filterValue) return;

    const dialogData: ViewUnitsDialogData = {
      units: [],
      isLoading: true,
      formatDate: (v) => this.formatDate(v),
    };

    this.dialog.open(ViewUnitsDialogComponent, {
      panelClass: 'view-units-side-dialog',
      data: dialogData,
      ariaLabelledBy: 'view-units-dialog-title',
    });

    this.service
      .getUnitsInfo(controlMode, filterValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          dialogData.units = data;
          dialogData.isLoading = false;
        },
        error: () => {
          dialogData.units = [];
          dialogData.isLoading = false;
        },
      });
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '-';
    const m = moment.utc(value);
    if (!m.isValid()) return value;
    // Collection dates are date-only values — display raw without timezone conversion
    // matching Oracle Forms FORMAT_MASK="DD-MON-YYYY" which shows the stored date as-is
    return m.format('DD-MMM-YYYY').toUpperCase();
  }

  private executeRelease(selected: ReleaseGroupInterdictionDto[]): void {
    this.isReleasing.set(true);

    const controlMode = this.currentSourceTestId();
    const filterValue = this.currentFilterValue();

    this.service
      .deleteInterdictions({
        controlMode,
        filterValue,
        interCodes: selected.map(i => i.interCode),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isReleasing.set(false);
          this.snackbarService.showSuccess(
            `${selected.length} interdiction(s) released successfully`,
          );
          this.selectedRows.set([]);
          // Remove released interdictions from the table without re-searching
          // This matches FMB key-clrfrm behaviour and avoids "Batch has no interdictions" message
          const releasedCodes = new Set(selected.map(i => i.interCode));
          this.allResults.set(this.allResults().filter(r => !releasedCodes.has(r.interCode)));
          this.totalCount.set(this.allResults().length);
        },
        error: () => {
          this.isReleasing.set(false);
        },
      });
  }

  private showValidationWarning(message: string): void {
    this.dialog.open(ConfirmActionDialogComponent, {
      width: '440px',
      ariaLabel: 'Validation Warning',
      data: {
        title: 'Warning',
        message: `${message}. Do you want to continue?`,
        confirmText: 'Yes',
        cancelText: 'No',
      } as ConfirmActionDialogData,
    }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result === true) {
          this.searchValueControl.reset('');
          this.searchValueControl.markAsUntouched();
          this.allResults.set([]);
          this.hasSearched.set(false);
        }
      });
  }

  private loadDropdownForMode(mode: SearchMode): void {
    const sourceTestId = SEARCH_MODE_TO_SOURCE_TEST_ID[mode];

    if (mode === 'ITBID') {
      this.isLoadingDropdown.set(false);
      return;
    }

    this.isLoadingDropdown.set(true);

    switch (mode) {
      case 'DRIVE':
        this.service.getDrivesDropdown(sourceTestId).pipe(takeUntil(this.destroy$)).subscribe({
          next: (data) => { this.driveOptions.set(data); this.isLoadingDropdown.set(false); },
          error: () => { this.driveOptions.set([]); this.isLoadingDropdown.set(false); },
        });
        break;
      case 'BATCH':
        this.service.getBatchesDropdown(sourceTestId).pipe(takeUntil(this.destroy$)).subscribe({
          next: (data) => { this.batchOptions.set(data); this.isLoadingDropdown.set(false); },
          error: () => { this.batchOptions.set([]); this.isLoadingDropdown.set(false); },
        });
        break;
      case 'COLL_DATE':
        this.service.getCollectionDatesDropdown(sourceTestId).pipe(takeUntil(this.destroy$)).subscribe({
          next: (data) => { this.collectionDateOptions.set(data); this.isLoadingDropdown.set(false); },
          error: () => { this.collectionDateOptions.set([]); this.isLoadingDropdown.set(false); },
        });
        break;
      case 'LOT':
        this.service.getLotNumbersDropdown(sourceTestId).pipe(takeUntil(this.destroy$)).subscribe({
          next: (data) => { this.lotNumberOptions.set(data); this.isLoadingDropdown.set(false); },
          error: () => { this.lotNumberOptions.set([]); this.isLoadingDropdown.set(false); },
        });
        break;
      case 'TB_ID':
        this.service.getTbIdsDropdown(sourceTestId).pipe(takeUntil(this.destroy$)).subscribe({
          next: (data) => { this.tbIdOptions.set(data); this.isLoadingDropdown.set(false); },
          error: () => { this.tbIdOptions.set([]); this.isLoadingDropdown.set(false); },
        });
        break;
    }
  }

  private setupFormSubscriptions(): void {
    this.searchModeControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((mode) => {
        if (mode) this.onSearchModeChange(mode);
      });

    // MIN-03: Apply uppercase programmatically for ITBID so AT reads the correct value
    this.searchValueControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (this.searchMode() === 'ITBID' && value) {
          const upper = value.toUpperCase();
          if (value !== upper) {
            this.searchValueControl.setValue(upper, { emitEvent: false });
          }
        }
      });
  }

  private focusSearchValueField(): void {
    const el = document.querySelector(
      '.query-field--value input, .query-field--value .mat-mdc-select',
    ) as HTMLElement;
    if (el) {
      el.focus();
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
      });
  }
}
