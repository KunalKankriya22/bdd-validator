import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  effect,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { DateAdapter, MAT_DATE_FORMATS, MatOptionModule } from '@angular/material/core';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent,
} from '@shared/interfaces/data-table.interface';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { MatDateFormats } from '@angular/material/core';

const DD_MON_YYYY_HH_MM_FORMATS: MatDateFormats = {
  parse: {
    dateInput: [
      'DD-MMM-YYYY, hh:mm A',
      'DD-MMM-YYYY',
      'MMDDYYYY',
      'MM/DD/YYYY',
      'MM-DD-YYYY',
      'YYYY-MM-DD',
    ],
  },
  display: {
    dateInput: 'DD-MMM-YYYY, hh:mm A',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD-MMM-YYYY, hh:mm A',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
import {
  UnitIdFieldComponent,
} from '@shared/components/unit-id-field';
import type { UnitIdPostValidateEvent } from '@shared/components/unit-id-field';
import type { UnitValidationResponse } from '@shared/components/unit-id-field';

import { VerifyComponentSuitabilityOfflineService } from './services/verify-component-suitability-offline.service';
import {
  ProcessCodeDto,
  ComponentEligibilityDto,
  VerifiedEntry,
  WarningDto,
} from './models/verify-component-suitability-offline.model';
import {
  WarningOverrideDialogComponent,
  WarningOverrideDialogData,
  WarningOverrideDialogResult,
} from './dialogs/warning-override-dialog';

@Component({
  selector: 'app-verify-component-suitability-offline',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule,
    MatDatepickerModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
  ],
  providers: [
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_HH_MM_FORMATS },
  ],
  templateUrl: './verify-component-suitability-offline.html',
  styleUrls: ['./verify-component-suitability-offline.scss'],
})
export class VerifyComponentSuitabilityOfflineComponent implements OnInit, OnDestroy {
  private readonly service = inject(VerifyComponentSuitabilityOfflineService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();
  private accumulatedOverrides: string[] = [];

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;
  @ViewChild('productSelect') productSelect!: MatSelect;
  @ViewChild('processDatInput') processDatInput!: ElementRef<HTMLInputElement>;

  private entrySavedSnackBarRef: MatSnackBarRef<TextOnlySnackBar> | null = null;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Verify Component Suitability – Offline' },
    ],
    title: 'Verify Component Suitability – Offline',
    subtitle: '',
  };

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
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  processCodes: ProcessCodeDto[] = [];
  processCodeControl = new FormControl<string>('', Validators.required);
  processDescription = '-';
  isProcessCodeLoading = false;

  productValue = '';
  aboRh = '--';
  expirationDateTime = '--';
  processDateControl = new FormControl<Date | null>(null);

  get maxProcessDate(): Date {
    return this.chapterTimezoneService.getChapterLocalDateTime().toDate();
  }

  processDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.processDatInput?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    },
  };

  unitScannedWarning = '';
  isVerifying = false;
  collectionDate: string | null = null;

  eligibleComponents: ComponentEligibilityDto[] = [];

  verifiedEntries: VerifiedEntry[] = [];
  savedCount = 0;

  tableConfig: DataTableConfig<VerifiedEntry> = {
    columns: [
      {
        key: 'unitId',
        header: 'Unit ID',
        sortable: true,
        minWidth: '180px',
      },
      {
        key: 'product',
        header: 'Product',
        minWidth: '140px',
      },
      {
        key: 'aboRh',
        header: 'ABO/Rh',
        minWidth: '120px',
      },
      {
        key: 'expirationDate',
        header: 'Expiration Date',
        minWidth: '180px',
      },
      {
        key: 'processDate',
        header: 'Process Date',
        minWidth: '180px',
      },
    ],
    sortConfig: {
      column: 'unitId',
      direction: 'D',
    },
    pagination: {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    showPagination: true,
    stickyHeader: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Scan or enter a Unit ID to begin,',
    noDataIcon: 'search',
    enableRowHighlight: false,
  };

  get selectedProcessCode(): string {
    return this.processCodeControl.value || '';
  }

  get unitIdColumnHeader(): string {
    const count = this.verifiedEntries.length;
    return count > 0 ? `Unit ID (${count})` : 'Unit ID';
  }

  get paginatedEntries(): VerifiedEntry[] {
    const page = this.tableConfig.pagination;
    if (!page) return this.verifiedEntries;
    const start = page.pageIndex * page.pageSize;
    return this.verifiedEntries.slice(start, start + page.pageSize);
  }

  ngOnInit(): void {
    this.loadProcessCodes();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.dismissEntrySavedSnackbar();
  }

  onProcessCodeChange(): void {
    const selected = this.processCodeControl.value;
    if (selected) {
      const found = this.processCodes.find(
        (pc) => pc.processCode === selected,
      );
      this.processDescription = found?.processCodeDesc || '-';
    } else {
      this.processDescription = '-';
    }
    this.resetEntryRow();
    this.verifiedEntries = [];
    this.savedCount = 0;
    this.updateTableConfig();
    this.updateUnitIdColumnHeader();
    this.dismissEntrySavedSnackbar();
    this.cdr.detectChanges();

    if (selected) {
      setTimeout(() => this.unitIdField?.unitIdInput?.nativeElement?.focus());
    }
  }

  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const unitId = event.data.parsedUnitId;
    forkJoin({
      unitDetails: this.service.getUnitDetails(unitId),
      components: this.service.getEligibleComponents(unitId, this.selectedProcessCode),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ unitDetails, components }) => {
          this.collectionDate = unitDetails?.collectionDate ?? null;

          const verifiedProducts = this.verifiedEntries
            .filter((e) => e.unitId === unitId)
            .map((e) => e.product);

          const remainingComponents = components.filter(
            (c) => !verifiedProducts.includes(c.productCode),
          );

          if (remainingComponents.length === 0) {
            if (verifiedProducts.length > 0) {
              event.reject('This Unit ID has been scanned');
            } else if (components.length === 0) {
              event.reject('No eligible components found for this unit and process code');
            } else {
              event.reject('All components for this unit have already been processed');
            }
            return;
          }

          this.eligibleComponents = remainingComponents;
          this.unitScannedWarning = '';

          if (remainingComponents.length > 0) {
            this.aboRh = remainingComponents[0].aboRh || remainingComponents[0].systemLabelDecision || '--';
            this.expirationDateTime = this.formatDateTime(
              remainingComponents[0].expiryDate || unitDetails?.expirationDate || unitDetails?.collectionDate,
            );
          }

          const chapterNow = this.chapterTimezoneService.getChapterLocalDateTime();
          this.processDateControl.setValue(chapterNow.toDate());

          event.confirm();
          this.cdr.detectChanges();
        },
        error: (error) => {
          const message =
            error?.error?.message || 'Unit not found or not eligible.';
          event.reject(message);
        },
      });
  }

  onUnitValidated(data: UnitValidationResponse): void {
    setTimeout(() => this.productSelect?.open());
  }

  onUnitCleared(): void {
    this.aboRh = '--';
    this.expirationDateTime = '--';
    this.unitScannedWarning = '';
    this.eligibleComponents = [];
    this.productValue = '';
  }

  onProductSelected(): void {
    setTimeout(() => this.processDatInput?.nativeElement?.focus());
  }

  getProcessDateError(): string {
    const control = this.processDateControl;
    if (!(control.touched || control.dirty)) return '';

    if (control.hasError('futureDate')) {
      return 'Process Date cannot be in the future';
    }

    if (control.hasError('beforeCollectionDate')) {
      return 'Process Date cannot be before the collection date';
    }

    const inputValue = this.processDatInput?.nativeElement?.value;
    if (!control.value && inputValue && inputValue.trim().length > 0) {
      return 'Invalid date format';
    }

    if (control.hasError('matDatepickerParse')) {
      return 'Invalid date format';
    }

    return '';
  }

  onProcessDateFocus(): void {
    if (!this.processDateControl.value) {
      const chapterNow = this.chapterTimezoneService.getChapterLocalDateTime();
      this.processDateControl.setValue(chapterNow.toDate());
    }
  }

  onProcessDateChange(): void {
    const value = this.processDateControl.value;
    if (value) {
      const selected = moment(value);
      const chapterNow = this.chapterTimezoneService.getChapterLocalDateTime();
      if (selected.isValid() && selected.hour() === 0 && selected.minute() === 0) {
        selected.hour(chapterNow.hour()).minute(chapterNow.minute());
        this.processDateControl.setValue(selected.toDate(), { emitEvent: false });
      }

      if (selected.isValid() && selected.isAfter(chapterNow)) {
        this.processDateControl.setErrors({ futureDate: true });
        this.processDateControl.markAsTouched();
        return;
      }

      if (this.collectionDate) {
        const collDate = moment(this.collectionDate);
        if (collDate.isValid() && selected.isBefore(collDate)) {
          this.processDateControl.setErrors({ beforeCollectionDate: true });
          this.processDateControl.markAsTouched();
          return;
        }
      }
    }
  }

  onProcessDateKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === 'Tab') {
      if (this.productValue && this.unitIdField?.isValid) {
        event.preventDefault();
        this.verifyEntry();
      }
    }
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig = {
        ...this.tableConfig,
        pagination: {
          ...this.tableConfig.pagination,
          pageIndex: event.pageIndex,
          pageSize: event.pageSize,
        },
      };
    }
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: {
        column: event.column,
        direction: event.direction,
      },
      ...(this.tableConfig.pagination && {
        pagination: {
          ...this.tableConfig.pagination,
          pageIndex: 0,
        },
      }),
    };

    this.sortEntries(event.column, event.direction);
  }

  private loadProcessCodes(): void {
    this.isProcessCodeLoading = true;
    this.service
      .getProcessCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.processCodes = codes;
          this.isProcessCodeLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.isProcessCodeLoading = false;
          this.showError('Failed to load process codes.');
          this.cdr.detectChanges();
        },
      });
  }

  private verifyEntry(): void {
    if (this.isVerifying) return;

    const processCode = this.selectedProcessCode;
    const unitId = this.unitIdField?.parsedUnitId;
    const product = this.productValue.trim();

    if (!processCode || !unitId || !product) return;
    if (!this.unitIdField.isValid) return;

    if (this.processDateControl.invalid) {
      this.processDateControl.markAsTouched();
      return;
    }

    const processDateValue = this.processDateControl.value
      ? moment(this.processDateControl.value)
      : null;

    if (processDateValue && processDateValue.isValid()) {
      const chapterNow = this.chapterTimezoneService.getChapterLocalDateTime();
      if (processDateValue.isAfter(chapterNow)) {
        this.processDateControl.setErrors({ futureDate: true });
        this.processDateControl.markAsTouched();
        return;
      }

      if (this.collectionDate) {
        const collDate = moment(this.collectionDate);
        if (collDate.isValid() && processDateValue.isBefore(collDate)) {
          this.processDateControl.setErrors({ beforeCollectionDate: true });
          this.processDateControl.markAsTouched();
          return;
        }
      }
    }

    this.isVerifying = true;
    const processDateIso = processDateValue?.isValid()
      ? this.chapterTimezoneService.convertLocalToGmt(processDateValue).toISOString()
      : undefined;

    const selectedComponent = this.eligibleComponents.find(
      (c) => c.productCode === product,
    );

    this.service
      .verify({
        processCode,
        unitId,
        componentPrefix: selectedComponent?.componentPrefix || product,
        processDats: processDateIso,
        overriddenWarnings: this.accumulatedOverrides.length > 0 ? this.accumulatedOverrides : undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isVerifying = false;

          if (response.status === 'WARNING' && response.warnings?.length) {
            this.showWarningDialog('Suitability Warnings', response.warnings, (override, codes) => {
              if (override) {
                this.accumulatedOverrides = [...new Set([...this.accumulatedOverrides, ...codes])];
                this.verifyEntry();
              }
            });
            this.cdr.detectChanges();
            return;
          }

          if (response.verificationSuccess) {
            this.accumulatedOverrides = [];
            const formattedProcessDate = processDateValue?.isValid()
              ? processDateValue.format('DD-MMM-YYYY, hh:mm A').toUpperCase()
              : moment().format('DD-MMM-YYYY, hh:mm A').toUpperCase();

            const entry: VerifiedEntry = {
              unitId,
              product,
              aboRh: this.aboRh,
              expirationDate: this.expirationDateTime,
              processDate: formattedProcessDate,
            };

            this.verifiedEntries = [entry, ...this.verifiedEntries];
            this.savedCount++;
            this.updateTableConfig();
            this.updateUnitIdColumnHeader();

            this.showEntrySavedSnackbar();
            this.unitIdField.clear();
            this.productValue = '';
            this.cdr.detectChanges();
            setTimeout(() => this.unitIdField?.unitIdInput?.nativeElement?.focus());
          } else {
            this.showError(
              response.message || 'Verification failed.',
            );
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          this.isVerifying = false;
          const message =
            error?.error?.message || 'Failed to verify component suitability.';
          this.showError(message);
          this.cdr.detectChanges();
        },
      });
  }

  private resetEntryRow(): void {
    this.unitIdField?.clear();
    this.productValue = '';
    this.aboRh = '--';
    this.expirationDateTime = '--';
    this.processDateControl.setValue(null);
    this.unitScannedWarning = '';
    this.eligibleComponents = [];
    this.collectionDate = null;
    this.accumulatedOverrides = [];
  }

  private updateTableConfig(): void {
    if (this.tableConfig.pagination) {
      this.tableConfig = {
        ...this.tableConfig,
        pagination: {
          ...this.tableConfig.pagination,
          totalRecords: this.verifiedEntries.length,
        },
      };
    }
  }

  private updateUnitIdColumnHeader(): void {
    const count = this.verifiedEntries.length;
    const columns = this.tableConfig.columns.map((col) =>
      col.key === 'unitId'
        ? { ...col, header: count > 0 ? `Unit ID (${count})` : 'Unit ID' }
        : col,
    );
    this.tableConfig = { ...this.tableConfig, columns };
  }

  private sortEntries(column: string, direction: string): void {
    const sorted = [...this.verifiedEntries].sort((a, b) => {
      const valA = (a as unknown as Record<string, string>)[column] || '';
      const valB = (b as unknown as Record<string, string>)[column] || '';
      const cmp = valA.localeCompare(valB);
      return direction === 'A' ? cmp : -cmp;
    });
    this.verifiedEntries = sorted;
  }


  private formatDateTime(dateStr: string | null | undefined): string {
    if (!dateStr) return '--';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '--';
      const day = String(date.getDate()).padStart(2, '0');
      const months = [
        'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
        'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
      ];
      const mon = months[date.getMonth()];
      const year = date.getFullYear();
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = String(hours % 12 || 12).padStart(2, '0');
      return `${day}-${mon}-${year}, ${displayHours}:${minutes} ${ampm}`;
    } catch {
      return '--';
    }
  }

  private getCurrentDateTime(): string {
    return this.formatDateTime(new Date().toISOString());
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.processCodeControl.setValue('');
        this.processDescription = '-';
        this.resetEntryRow();
        this.verifiedEntries = [];
        this.savedCount = 0;
        this.updateTableConfig();
        this.updateUnitIdColumnHeader();
        this.dismissEntrySavedSnackbar();
        this.loadProcessCodes();
        this.cdr.detectChanges();
      });
  }

  private showWarningDialog(
    title: string,
    warnings: WarningDto[],
    callback: (override: boolean, codes: string[]) => void,
  ): void {
    const dialogData: WarningOverrideDialogData = {
      title,
      warnings,
      allowOverride: true,
    };

    const dialogRef = this.dialog.open(WarningOverrideDialogComponent, {
      width: '560px',
      disableClose: true,
      data: dialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: WarningOverrideDialogResult) => {
        if (result) {
          callback(result.override, result.codes);
        } else {
          callback(false, []);
        }
      });
  }

  private showEntrySavedSnackbar(): void {
    this.dismissEntrySavedSnackbar();

    const count = this.savedCount;
    const message = count === 1 ? '1 Entry Saved' : `${count} Entries Saved`;

    this.entrySavedSnackBarRef = this.snackBar.open(message, 'DISMISS', {
      duration: 0,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });

    this.entrySavedSnackBarRef.onAction().subscribe(() => {
      this.entrySavedSnackBarRef?.dismiss();
      this.entrySavedSnackBarRef = null;
    });
  }

  private dismissEntrySavedSnackbar(): void {
    if (this.entrySavedSnackBarRef) {
      this.entrySavedSnackBarRef.dismiss();
      this.entrySavedSnackBarRef = null;
    }
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }
}
