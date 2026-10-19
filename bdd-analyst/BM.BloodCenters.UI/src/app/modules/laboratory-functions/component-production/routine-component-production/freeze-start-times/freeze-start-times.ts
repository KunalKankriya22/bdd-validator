import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';

import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoginService } from '@shared/services/login.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { UnitIdFieldComponent, UnitValidationResponse, UnitIdPostValidateEvent } from '@shared/components/unit-id-field';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { formatTableDate, formatTableDateTime } from '@shared/utils/date-format.util';

import { FreezeStartTimesService } from './services/freeze-start-times.service';
import {
  RecordFreezeStartTimeDto,
  EligibleComponentDto,
  UnitBleedInfoDto,
  FreezeStartTimeDisplay,
  ProductOption
} from './models/freeze-start-times.model';

@Component({
  selector: 'app-freeze-start-times-offline',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    UnitIdFieldComponent,
    PageHeaderWithBreadcrumb,
    DataTable
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './freeze-start-times.html',
  styleUrl: './freeze-start-times.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FreezeStartTimesOfflineComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `freeze-start-times-${FreezeStartTimesOfflineComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly freezeStartService = inject(FreezeStartTimesService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly loginService = inject(LoginService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  protected readonly pageHeaderService = inject(PageHeaderService);
  protected readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  protected readonly headerConfig = computed<PageHeaderConfig>(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    return {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: pageData?.title || 'Freeze Start Time Offline', link: null }
      ],
    };
  });

  protected readonly freezeForm = new FormGroup({
    productCode: new FormControl<string | null>(null, [Validators.required]),
    freezeStartDate: new FormControl<Moment | null>(null),
    freezeTime: new FormControl<string | null>(null, [
      Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
      this.validateNotFutureTime.bind(this)
    ])
  });

  protected readonly productSearchCtrl = new FormControl('');
  private readonly productSearchText = signal('');

  // State signals
  protected readonly eligibleComponents = signal<EligibleComponentDto[]>([]);
  protected readonly productOptions = signal<ProductOption[]>([]);
  protected readonly unitInfo = signal<UnitBleedInfoDto | null>(null);
  protected readonly validatedUnitId = signal<string>('');
  protected readonly scannedEntries = signal<FreezeStartTimeDisplay[]>([]);
  protected readonly selectedProductOption = signal<ProductOption | null>(null);
  protected readonly duplicateError = signal<string | null>(null);
  protected readonly isProcessing = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly savedCount = signal(0);
  private readonly currentPageIndex = signal(0);
  private readonly currentPageSize = signal(10);
  private readonly sortDirection = signal<'A' | 'D' | 'default'>('D');

  // Computed values
  protected readonly filteredProductOptions = computed(() => {
    const search = this.productSearchText().toLowerCase();
    const options = this.productOptions();
    if (!search) return options;
    return options.filter(opt =>
      opt.displayValue.toLowerCase().includes(search) ||
      opt.productDescription.toLowerCase().includes(search)
    );
  });

  protected readonly sortedEntries = computed(() => {
    const entries = [...this.scannedEntries()];
    const direction = this.sortDirection();

    if (direction === 'default') {
      return entries;
    }

    return entries.sort((a, b) => {
      const comparison = a.unitId.localeCompare(b.unitId);
      return direction === 'A' ? comparison : -comparison;
    });
  });

  protected readonly paginatedData = computed(() => {
    const all = this.sortedEntries();
    const start = this.currentPageIndex() * this.currentPageSize();
    return all.slice(start, start + this.currentPageSize());
  });

  protected readonly collectionDate = computed(() => {
    const info = this.unitInfo();
    return info ? formatTableDate(info.collDate) : '-';
  });

  protected readonly productDescription = computed(() => {
    const option = this.selectedProductOption();
    return option ? option.productDescription : '-';
  });

  protected readonly formReady = computed(() => {
    return this.unitInfo() !== null && this.eligibleComponents().length > 0;
  });

  protected readonly unitIdHeader = computed(() => {
    const count = this.scannedEntries().length;
    return count > 0 ? `Unit ID (${count})` : 'Unit ID';
  });

  protected tableConfig: DataTableConfig<FreezeStartTimeDisplay> = {
    columns: [
      {
        key: 'unitId',
        header: 'Unit ID',
        sortable: true,
        minWidth: '150px',
        valueFormatter: (value: any) => this.formatUnitId(value),
      },
      { key: 'collectionDate', header: 'Collection Date', width: '200px' },
      { key: 'productCode', header: 'Product Code', width: '200px' },
      { key: 'productDescription', header: 'Product Description', minWidth: '200px' },
      { key: 'freezeStart', header: 'Freeze Start', minWidth: '180px' }
    ],
    pagination: {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'unitId',
      direction: 'D'
    },
    stickyHeader: true,
    showPagination: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Scan or enter a Unit ID to begin.',
    noDataIcon: 'search',
    enableRowHighlight: false,
  };

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Get chapter's current date/time with robust fallback chain.
   *
   * Priority 1: Use ChapterTimezoneService.getChapterLocalDateTime() (API-based, most accurate)
   * Priority 2: Use headerService.getCurrentChapterTimezone() with Intl.DateTimeFormat
   * Priority 3: Fall back to browser's local time
   *
   * @returns Moment object representing current date/time in chapter's timezone
   */
  private getChapterCurrentDateTime(): Moment {
    // Priority 1: Use chapter local datetime from API (most accurate)
    if (this.chapterTimezoneService.isChapterLocalDateAvailable()) {
      return this.chapterTimezoneService.getChapterLocalDateTime();
    }

    // Priority 2: Use chapter timezone string with Intl.DateTimeFormat
    const chapterTimezone = this.headerService.getCurrentChapterTimezone();
    if (chapterTimezone && chapterTimezone !== 'UTC') {
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: chapterTimezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });

        const parts = formatter.formatToParts(now);
        const year = parseInt(parts.find(p => p.type === 'year')!.value, 10);
        const month = parseInt(parts.find(p => p.type === 'month')!.value, 10) - 1; // 0-based
        const day = parseInt(parts.find(p => p.type === 'day')!.value, 10);
        const hour = parseInt(parts.find(p => p.type === 'hour')!.value, 10);
        const minute = parseInt(parts.find(p => p.type === 'minute')!.value, 10);
        const second = parseInt(parts.find(p => p.type === 'second')!.value, 10);

        return moment({ year, month, day, hour, minute, second });
      } catch (error) {
        console.warn('Failed to get time using chapter timezone, falling back to browser time:', error);
      }
    }

    // Priority 3: Fall back to browser's local time (last resort)
    return moment();
  }

  /**
   * Get chapter's current date with robust fallback chain.
   *
   * @returns Moment object representing current date in chapter's timezone
   */
  private getChapterCurrentDate(): Moment {
    // Priority 1: Use chapter local date from API
    if (this.chapterTimezoneService.isChapterLocalDateAvailable()) {
      return this.chapterTimezoneService.getChapterLocalDate();
    }

    // Priority 2: Use chapter timezone string
    const chapterTimezone = this.headerService.getCurrentChapterTimezone();
    if (chapterTimezone && chapterTimezone !== 'UTC') {
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: chapterTimezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });

        const parts = formatter.formatToParts(now);
        const year = parseInt(parts.find(p => p.type === 'year')!.value, 10);
        const month = parseInt(parts.find(p => p.type === 'month')!.value, 10) - 1; // 0-based
        const day = parseInt(parts.find(p => p.type === 'day')!.value, 10);

        return moment({ year, month, day }).startOf('day');
      } catch (error) {
        console.warn('Failed to get date using chapter timezone, falling back to browser date:', error);
      }
    }

    // Priority 3: Fall back to browser's local date
    return moment().startOf('day');
  }

  /**
   * Get maximum allowed date for freeze start date picker.
   * Returns chapter's current date - freeze cannot be in the future.
   */
  protected getMaxDate(): Moment {
    return this.getChapterCurrentDate();
  }

  /**
   * Date filter for freeze start date picker.
   * Prevents selection of future dates relative to chapter's current date.
   */
  protected freezeDateFilter = (date: Moment | null): boolean => {
    if (!date) return true;
    const chapterToday = this.getChapterCurrentDate();
    const checkDate = moment.isMoment(date) ? date : moment(date);
    return checkDate.format('YYYY-MM-DD') <= chapterToday.format('YYYY-MM-DD');
  };

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.clearAll());
  }

  private setupFormListeners(): void {
    this.freezeForm.get('productCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedValue) => {
        const option = selectedValue
          ? this.productOptions().find(opt => opt.displayValue === selectedValue) || null
          : null;
        this.selectedProductOption.set(option);

        if (option && !this.freezeForm.get('freezeStartDate')?.value) {
          const chapterNow = this.chapterTimezoneService.getChapterLocalDateTime() || moment();
          this.freezeForm.patchValue({
            freezeStartDate: chapterNow.clone(),
            freezeTime: chapterNow.format('HH:mm')
          });
        }
      });

    // Re-validate time when date changes (for future time validation)
    this.freezeForm.get('freezeStartDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const timeControl = this.freezeForm.get('freezeTime');
        if (timeControl?.value) {
          timeControl.updateValueAndValidity();
        }
      });

    this.productSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.productSearchText.set(v || ''));
  }

  /**
   * Step 1: Format validation passed (unit-id-field).
   * Run freeze-specific validation via API before confirming.
   */
  protected onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    this.duplicateError.set(null);
    this.isProcessing.set(true);
    this.cdr.markForCheck();

    const unitIdWithCheckDigit = event.data.manualUnitId;
    const parsedId = event.data.parsedUnitId;

    // Call API to get unit bleed info
    this.freezeStartService.getUnitBleedInfo(parsedId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (unitBleedInfo) => {
          this.unitInfo.set(unitBleedInfo);
          this.validatedUnitId.set(unitIdWithCheckDigit);
          this.isProcessing.set(false);
          this.cdr.markForCheck();

          // Confirm unit validation to the unit-id-field component
          event.confirm();

          // Load eligible components
          this.loadEligibleComponents(parsedId);
        },
        error: (error) => {
          this.isProcessing.set(false);
          this.cdr.markForCheck();
          event.reject(error.error?.message || error.error?.errorResponse?.error || 'Unit validation failed');
        }
      });
  }

  /**
   * Step 2: Both validations passed. Format the Unit ID display.
   */
  protected onUnitValidated(data: UnitValidationResponse): void {
    setTimeout(() => {
      if (this.unitIdField && data.manualUnitId) {
        const formattedUnitId = this.formatUnitId(data.manualUnitId);
        this.unitIdField.unitIdControl.setValue(formattedUnitId, { emitEvent: false });
      }
    }, 100);
  }

  /**
   * Load eligible frozen components for the validated unit.
   */
  private loadEligibleComponents(unitId: string): void {
    this.freezeStartService.getEligibleComponents(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (components) => {
          this.eligibleComponents.set(components);

          const options: ProductOption[] = components.map(comp => ({
            displayValue: comp.productCode,
            productCode: comp.productCode,
            productDescription: comp.productDescription,
            aliquot: comp.aliquot
          }));
          this.productOptions.set(options);
          this.cdr.markForCheck();

          if (components.length === 0) {
            this.snackbarService.showError('No eligible frozen products for this unit');
            this.unitIdField?.clear();
            this.unitInfo.set(null);
            return;
          }

          if (options.length === 1) {
            // Single product — auto-select, set date/time defaults, focus date
            const chapterNow = this.chapterTimezoneService.getChapterLocalDateTime() || moment();
            this.freezeForm.patchValue({
              productCode: options[0].displayValue,
              freezeStartDate: chapterNow.clone(),
              freezeTime: chapterNow.format('HH:mm')
            });
            setTimeout(() => {
              const dateField = document.getElementById(this.elementId('freeze-date'));
              if (dateField) dateField.focus();
            }, 100);
          } else {
            // Multiple products — focus dropdown
            setTimeout(() => {
              const productField = document.getElementById(this.elementId('product-code'));
              if (productField) productField.focus();
            }, 100);
          }
        },
        error: (error) => {
          const errorMessage = error?.error?.message || error?.message || 'No eligible components found';
          this.snackbarService.showError(errorMessage);
          this.unitInfo.set(null);
          this.eligibleComponents.set([]);
          this.productOptions.set([]);
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Handle Unit ID field cleared — reset all dependent fields.
   */
  protected onUnitCleared(): void {
    this.duplicateError.set(null);
    this.validatedUnitId.set('');
    this.unitInfo.set(null);
    this.eligibleComponents.set([]);
    this.productOptions.set([]);
    this.freezeForm.reset();
    this.cdr.markForCheck();
  }

  /**
   * Handle Enter key in Time field — trigger record save.
   */
  protected onTimeBlur(): void {
    this.autoFormatTime();
  }

  protected onTimeEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.autoFormatTime();
      this.recordFreezeTime();
    }
  }

  private autoFormatTime(): void {
    const timeControl = this.freezeForm.get('freezeTime');
    const raw = timeControl?.value;
    if (!raw) return;

    if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(raw)) return;

    const digits = raw.replace(/\D/g, '');
    if (!digits) return;

    let hours: string;
    let minutes: string;

    if (digits.length <= 2) {
      hours = digits.padStart(2, '0');
      minutes = '00';
    } else {
      const padded = digits.substring(0, 4).padEnd(4, '0');
      hours = padded.substring(0, 2);
      minutes = padded.substring(2, 4);
    }

    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);

    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      timeControl?.setValue(`${hours}:${minutes}`);
    }
  }

  /**
   * Record freeze start time via API.
   * Sends time in chapter local time (ISO 8601) — API converts to GMT.
   */
  protected recordFreezeTime(): void {
    if (this.freezeForm.invalid || !this.unitInfo()) {
      Object.keys(this.freezeForm.controls).forEach(key => {
        this.freezeForm.get(key)?.markAsTouched();
      });
      return;
    }

    const selectedOption = this.selectedProductOption();

    if (!selectedOption || !selectedOption.productCode) {
      this.snackbarService.showError('Please select a valid product');
      return;
    }

    // Duplicate check at component level (unit + product + aliquot)
    const isDuplicate = this.scannedEntries().some(
      entry => entry.unitId === this.unitInfo()!.unitId
        && entry.productCode === selectedOption.productCode
        && entry.aliquot === selectedOption.aliquot
    );
    if (isDuplicate) {
      this.snackbarService.showError('Freeze details already recorded for this component');
      return;
    }

    const freezeDate = this.freezeForm.get('freezeStartDate')?.value as Moment | null;
    const freezeTime = this.freezeForm.get('freezeTime')?.value as string | null;

    // Build freeze start local time if both date and time are provided
    let freezeStartLocal: string | null = null;
    let freezeStartMoment: Moment | null = null;

    if (freezeDate && freezeTime) {
      const [hours, minutes] = freezeTime.split(':');
      freezeStartMoment = freezeDate.clone()
        .hour(parseInt(hours, 10))
        .minute(parseInt(minutes, 10))
        .second(0);
      freezeStartLocal = freezeStartMoment.format('YYYY-MM-DDTHH:mm:00');
    }

    const request: RecordFreezeStartTimeDto = {
      unitId: this.unitInfo()!.unitId,
      productCode: selectedOption.productCode,
      aliquot: selectedOption.aliquot,
      freezeStartTime: freezeStartLocal || ''
    };

    const isToday = freezeDate && freezeDate.isSame(this.getChapterCurrentDate(), 'day');

    if (!isToday && freezeDate) {
      this.showCmtiConfirmDialog().subscribe(confirmed => {
        if (confirmed) {
          this.saveEntry(request, selectedOption, freezeStartMoment, freezeStartLocal);
        }
      });
    } else {
      this.saveEntry(request, selectedOption, freezeStartMoment, freezeStartLocal);
    }
  }

  private saveEntry(
    request: RecordFreezeStartTimeDto,
    selectedOption: ProductOption,
    freezeStartMoment: Moment | null,
    freezeStartLocal: string | null
  ): void {
    this.isSaving.set(true);
    this.cdr.markForCheck();

    this.freezeStartService.recordFreezeStartTime(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const entry: FreezeStartTimeDisplay = {
            unitId: this.validatedUnitId() || this.unitInfo()!.unitId,
            collectionDate: this.collectionDate(),
            productCode: selectedOption.productCode,
            productDescription: selectedOption.productDescription,
            freezeStart: freezeStartMoment ? freezeStartMoment.format('DD-MMM-YYYY HH:mm').toUpperCase() : '-',
            freezeStartTime: freezeStartLocal || '',
            aliquot: selectedOption.aliquot,
            cmtiInterdictionGenerated: response.cmtiInterdictionGenerated,
            interdictionMessage: response.interdictionMessage
          };
          this.addEntryAndProceed(entry);
        },
        error: (error) => {
          this.isSaving.set(false);
          this.cdr.markForCheck();
          const errorMessage = error?.error?.message || error?.error?.errorResponse?.error || 'Failed to record freeze start time';
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  private addEntryAndProceed(entry: FreezeStartTimeDisplay): void {
    this.scannedEntries.update(entries => [entry, ...entries]);
    this.updateTablePagination();

    const newCount = this.savedCount() + 1;
    this.savedCount.set(newCount);
    this.snackbarService.showSuccess(`${newCount} ${newCount === 1 ? 'Entry' : 'Entries'} saved`);

    this.isSaving.set(false);
    this.cdr.markForCheck();
    this.resetForNextScan();

    if (entry.cmtiInterdictionGenerated && entry.interdictionMessage) {
      this.showCmtiWarningDialog(entry.interdictionMessage);
    } else {
      setTimeout(() => this.unitIdField?.focus(), 100);
    }
  }

  private showCmtiWarningDialog(warningMessage: string): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      disableClose: false,
      data: {
        title: 'CMTI Interdiction Warning',
        message: warningMessage,
        detail: 'The freeze entry has been saved, but a CMTI (Component Manufacturing Time Interdiction) has been assigned to this component due to exceeding the time limit.',
        confirmText: 'OK',
        cancelText: undefined,
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        setTimeout(() => this.unitIdField?.focus(), 100);
      });
  }

  private showCmtiConfirmDialog() {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      disableClose: true,
      data: {
        title: 'CMTI Interdiction Warning',
        message: 'Component has CMTI interdiction',
        detail: 'The freeze entry has been saved, but a CMTI (Component Manufacturing Time Interdiction) has been assigned to this component due to exceeding the time limit. Do you want to proceed or change the time?',
        confirmText: 'Yes, Proceed',
        cancelText: 'No, Cancel',
      },
    });

    return dialogRef.afterClosed().pipe(takeUntil(this.destroy$));
  }

  /**
   * Reset form for next scan entry.
   */
  private resetForNextScan(): void {
    this.freezeForm.reset({}, { emitEvent: false });
    this.freezeForm.markAsPristine();
    this.freezeForm.markAsUntouched();

    if (this.unitIdField) {
      this.unitIdField.clear();
    }

    this.duplicateError.set(null);
    this.validatedUnitId.set('');
    this.unitInfo.set(null);
    this.eligibleComponents.set([]);
    this.productOptions.set([]);
    this.selectedProductOption.set(null);
  }

  /**
   * Clear all data (chapter change or explicit clear).
   */
  private clearAll(): void {
    this.resetForNextScan();
    this.scannedEntries.set([]);
    this.savedCount.set(0);
    this.sortDirection.set('D');
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.direction = 'D';
    }
    this.updateTablePagination();
  }

  protected onPageChange(event: TablePageEvent): void {
    this.currentPageIndex.set(event.pageIndex);
    this.currentPageSize.set(event.pageSize);
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
  }

  protected onSortChange(event: TableSortEvent): void {
    if (event.column === 'unitId') {
      const currentDirection = this.sortDirection();
      let newDirection: 'A' | 'D' | 'default';

      if (currentDirection === 'D') {
        newDirection = 'A';
      } else if (currentDirection === 'A') {
        newDirection = 'default';
      } else {
        newDirection = 'D';
      }

      this.sortDirection.set(newDirection);

      if (this.tableConfig.sortConfig) {
        this.tableConfig.sortConfig.direction = newDirection;
        this.tableConfig = { ...this.tableConfig };
      }

      if (this.tableConfig.pagination) {
        this.tableConfig.pagination.pageIndex = 0;
      }
      this.currentPageIndex.set(0);
      this.cdr.markForCheck();
    }
  }

  private updateTablePagination(): void {
    this.currentPageIndex.set(0);
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.totalRecords = this.scannedEntries().length;
      this.tableConfig.pagination.pageIndex = 0;
    }
    // Update Unit ID column header with count
    const unitIdColumn = this.tableConfig.columns.find(col => col.key === 'unitId');
    if (unitIdColumn) {
      unitIdColumn.header = this.unitIdHeader();
    }
    this.tableConfig = { ...this.tableConfig };
  }

  /**
   * Custom validator: Validates that the selected date and time combination
   * is not in the future relative to the chapter's current date/time.
   *
   * This validator checks:
   * 1. If both date and time are provided
   * 2. Combines them into a single datetime
   * 3. Compares against chapter's current datetime
   * 4. Returns error if the combined datetime is in the future
   *
   * Priority 1: Uses ChapterTimezoneService.getChapterLocalDateTime() (API-based)
   * Priority 2: Uses headerService.getCurrentChapterTimezone() with Intl.DateTimeFormat
   * Priority 3: Falls back to browser's local time
   */
  private validateNotFutureTime(control: AbstractControl): { [key: string]: any } | null {
    const timeValue = control.value;
    if (!timeValue) {
      return null; // Time is optional, let required validator handle empty values
    }

    // Get the selected date from the form
    const selectedDate = this.freezeForm?.get('freezeStartDate')?.value as Moment | null;
    if (!selectedDate) {
      return null; // No date selected yet, can't validate time
    }

    // Validate time format first
    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timePattern.test(timeValue)) {
      return null; // Let the pattern validator handle format errors
    }

    // Parse the time
    const [hours, minutes] = timeValue.split(':').map(Number);

    // Combine date and time
    const selectedDateTime = selectedDate.clone()
      .hour(hours)
      .minute(minutes)
      .second(0);

    // Get chapter's current datetime with fallback chain
    const chapterNow = this.getChapterCurrentDateTime();

    // Check if the selected datetime is in the future
    if (selectedDateTime.isAfter(chapterNow)) {
      return { futureTime: true };
    }

    return null;
  }

  /**
   * Format Unit ID for display with hyphens (matching FRZ pattern).
   */
  formatUnitId(unitId: string): string {
    if (!unitId) return unitId;

    const dinPattern = /^([A-Z]\d{4})(\d{2})(\d{6})(-[A-Z0-9])$/;
    const dinMatch = unitId.match(dinPattern);
    if (dinMatch) {
      return `${dinMatch[1]}-${dinMatch[2]}-${dinMatch[3]}${dinMatch[4]}`;
    }

    const isbtPattern = /^([A-Z]\d{4})(\d{2})(\d{6})$/;
    const isbtMatch = unitId.match(isbtPattern);
    if (isbtMatch) {
      return `${isbtMatch[1]}-${isbtMatch[2]}-${isbtMatch[3]}`;
    }

    return unitId;
  }

  get f() {
    return this.freezeForm.controls;
  }
}
