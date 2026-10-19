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
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import moment from 'moment';

import { MaintainBatchDataService } from './services/maintain-batch-data.service';
import {
  MaintainBatchDataLovDto,
  MaintainBatchDataResponseDto,
  MaintainBatchDataUpdateRequestDto,
} from './models/maintain-batch-data.model';
import {
  BatchNotesDialogComponent,
  BatchNotesDialogData,
} from './dialogs/batch-notes-dialog/batch-notes-dialog';

const isbtDateTimeFormatValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;
  const regex = /^(0[1-9]|[12][0-9]|3[01])-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-\d{4},?\s([01]\d|2[0-3]):[0-5]\d$/i;
  return regex.test(value) ? null : { invalidIsbtFormat: true };
};

function futureDateValidator(chapterTimezoneService: ChapterTimezoneService): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const regex = /^(0[1-9]|[12][0-9]|3[01])-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-\d{4},?\s([01]\d|2[0-3]):[0-5]\d$/i;
    if (!regex.test(value)) return null;
    const normalized = value.replace(',', '');
    const parsed = moment(normalized, 'DD-MMM-YYYY HH:mm', true);
    if (!parsed.isValid()) return null;
    const chapterNow = chapterTimezoneService.getChapterLocalDateTime();
    return parsed.isAfter(chapterNow) ? { futureDate: true } : null;
  };
}

@Component({
  selector: 'app-maintain-batch-data',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    {
      provide: DateAdapter,
      useClass: ChapterAwareDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
  ],
  templateUrl: './maintain-batch-data.html',
  styleUrls: ['./maintain-batch-data.scss'],
})
export class MaintainBatchDataComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly batchService = inject(MaintainBatchDataService);
  private readonly dialog = inject(MatDialog);

  @ViewChild('batchSelect') batchSelect?: MatSelect;

  headerConfig = computed<PageHeaderConfig>(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    if (pageData) {
      return {
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: pageData.title, link: null },
        ],
        title: pageData.title,
        subtitle: pageData.subtitle || '',
      };
    }
    return {
      breadcrumbs: [{ label: 'Home', link: '/home' }],
      title: '',
      subtitle: '',
    };
  });

  // LOV dropdown state
  allBatchItems = signal<MaintainBatchDataLovDto[]>([]);
  batchSearchCtrl = new FormControl('');
  private searchTerm = signal('');
  filteredBatchItems = computed(() => {
    const q = this.searchTerm().toLowerCase();
    const items = this.allBatchItems();
    return q
      ? items.filter((o) => o.batchId?.toLowerCase().includes(q))
      : items;
  });
  isLoadingLov = false;

  // Batch detail state
  selectedBatch: MaintainBatchDataResponseDto | null = null;
  originalBatchData: MaintainBatchDataResponseDto | null = null;
  isLoadingBatch = false;
  isSaving = false;

  // Form
  batchIdControl = new FormControl<string | null>(null);
  form!: FormGroup;

  shippedDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getShippedDateError()
  );

  constructor() {
    this.initForm();

    effect(() => {
      this.filteredBatchItems();
      setTimeout(() => {
        if (this.batchSelect?.panelOpen) {
          (this.batchSelect as any)._keyManager?.setActiveItem(1);
        }
      });
    });
  }

  ngOnInit(): void {
    this.loadBatchLov();
    this.subscribeToChapterChanges();
    this.setupSearchListener();
    this.setupDateTimeAutoUppercase();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Form Setup ──

  private initForm(): void {
    this.form = this.fb.group({
      receivedDate: ['', [Validators.required, isbtDateTimeFormatValidator, futureDateValidator(this.chapterTimezoneService)]],
      shippedDate: [null],
      minTemp: [null, [Validators.required]],
      maxTemp: [null, [Validators.required]],
      qcDate: [{ value: '', disabled: true }, [isbtDateTimeFormatValidator]],
      resultsQcDate: [{ value: '', disabled: true }, [isbtDateTimeFormatValidator]],
    });
  }

  private isCbBatch(batchId: string | null): boolean {
    return !!batchId && batchId.length >= 9 && batchId.substring(7, 9) === 'CB';
  }

  // Shipped Date: block dates after batch date (first 6 chars of batchId = MMDDYY)
  maxShippedDate: Date | null = null;

  private parseBatchDate(batchId: string | null): Date | null {
    if (!batchId || batchId.length < 6) return null;
    const mm = batchId.substring(0, 2);
    const dd = batchId.substring(2, 4);
    const yy = batchId.substring(4, 6);
    const year = Number(yy) + 2000;
    const parsed = new Date(year, Number(mm) - 1, Number(dd));
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  // ── LOV ──

  private loadBatchLov(): void {
    this.isLoadingLov = true;
    this.batchService
      .getBatchLov()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoadingLov = false))
      )
      .subscribe({
        next: (data) => this.allBatchItems.set(data),
        error: () => this.allBatchItems.set([]),
      });
  }

  private setupDateTimeAutoUppercase(): void {
    ['receivedDate', 'qcDate', 'resultsQcDate'].forEach(controlName => {
      this.form.get(controlName)?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe((value: string) => {
          if (value && typeof value === 'string' && value !== value.toUpperCase()) {
            this.form.get(controlName)?.setValue(value.toUpperCase(), { emitEvent: false });
          }
        });
    });
  }

  private setupSearchListener(): void {
    this.batchSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.searchTerm.set(value || ''));
  }

  onBatchSelectOpened(opened: boolean): void {
    if (opened && this.batchSelect) {
      (this.batchSelect as any)._keyManager?.setActiveItem(-1);
    }
  }

  // ── Batch Selection ──

  onBatchIdChange(batchId: string | null): void {
    if (!batchId) {
      this.selectedBatch = null;
      this.originalBatchData = null;
      this.form.reset();
      return;
    }

    this.isLoadingBatch = true;
    this.batchService
      .getBatchById(batchId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoadingBatch = false))
      )
      .subscribe({
        next: (batch) => {
          if (batch) {
            this.selectedBatch = batch;
            this.originalBatchData = { ...batch };
            this.populateForm(batch);
          } else {
            this.selectedBatch = null;
            this.originalBatchData = null;
          }
        },
        error: () => {
          this.selectedBatch = null;
          this.originalBatchData = null;
        },
      });
  }

  private populateForm(batch: MaintainBatchDataResponseDto): void {
    const receivedMoment = batch.receivedDate ? moment(batch.receivedDate) : null;
    const qcMoment = batch.qcDate ? moment(batch.qcDate) : null;
    const resultsQcMoment = batch.resultsQcDate ? moment(batch.resultsQcDate) : null;

    this.form.patchValue({
      receivedDate: receivedMoment ? receivedMoment.format('DD-MMM-YYYY HH:mm').toUpperCase() : '',
      shippedDate: batch.shippedDate ? new Date(batch.shippedDate) : null,
      minTemp: batch.minTemp,
      maxTemp: batch.maxTemp,
      qcDate: qcMoment ? qcMoment.format('DD-MMM-YYYY HH:mm').toUpperCase() : '',
      resultsQcDate: resultsQcMoment ? resultsQcMoment.format('DD-MMM-YYYY HH:mm').toUpperCase() : '',
    });

    // QC Date: insertable only when null AND resultsQcDate is null
    const qcDateCtrl = this.form.get('qcDate')!;
    if (!batch.qcDate && !batch.resultsQcDate) {
      qcDateCtrl.enable({ emitEvent: false });
    } else {
      qcDateCtrl.disable({ emitEvent: false });
    }

    // Results QC Date: insertable only when null
    const resultsQcDateCtrl = this.form.get('resultsQcDate')!;
    if (!batch.resultsQcDate) {
      resultsQcDateCtrl.enable({ emitEvent: false });
    } else {
      resultsQcDateCtrl.disable({ emitEvent: false });
    }

    // CB batch type: disable receivedDate and shippedDate
    const isCb = this.isCbBatch(batch.batchId);
    if (isCb) {
      this.form.get('receivedDate')!.disable({ emitEvent: false });
      this.form.get('shippedDate')!.disable({ emitEvent: false });
    } else {
      this.form.get('receivedDate')!.enable({ emitEvent: false });
      this.form.get('shippedDate')!.enable({ emitEvent: false });
    }

    // Parse batch date from batchId for shipped date max validation
    this.maxShippedDate = this.parseBatchDate(batch.batchId);

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  // ── Chapter Change ──

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.batchIdControl.setValue(null, { emitEvent: false });
        this.selectedBatch = null;
        this.originalBatchData = null;
        this.form.reset();
        this.form.markAsPristine();
        this.allBatchItems.set([]);
        this.loadBatchLov();
      });
  }

  // ── Validation ──

  get isFormValid(): boolean {
    if (!this.selectedBatch || !this.form?.dirty) return false;

    const hasReceivedError = this.getReceivedDateError() !== '';
    const hasShippedError = this.getShippedDateError() !== '';
    const hasTempError = this.getTempError() !== '';
    const hasQcDateError = this.getQcDateError() !== '';
    const hasResultsQcDateError = this.getResultsQcDateError() !== '';

    const minTempCtrl = this.form.get('minTemp');
    const maxTempCtrl = this.form.get('maxTemp');

    const hasRequiredError =
      minTempCtrl?.hasError('required') ||
      maxTempCtrl?.hasError('required');

    return !hasReceivedError && !hasShippedError && !hasTempError
      && !hasQcDateError && !hasResultsQcDateError && !hasRequiredError;
  }

  getReceivedDateError(): string {
    const ctrl = this.form.get('receivedDate');
    if (!ctrl || !(ctrl.touched || ctrl.dirty)) return '';
    if (ctrl.hasError('required')) return 'Received Date is required';
    if (ctrl.hasError('invalidIsbtFormat')) return 'Date must be in format DD-MMM-YYYY HH:mm (e.g., 02-FEB-2025 05:30)';
    if (ctrl.hasError('futureDate')) return 'Received Date cannot be a future date';
    return '';
  }

  getQcDateError(): string {
    const ctrl = this.form.get('qcDate');
    if (!ctrl || ctrl.disabled || !(ctrl.touched || ctrl.dirty)) return '';
    if (ctrl.hasError('invalidIsbtFormat')) return 'Date must be in format DD-MMM-YYYY HH:mm (e.g., 02-FEB-2025 05:30)';
    return '';
  }

  getResultsQcDateError(): string {
    const ctrl = this.form.get('resultsQcDate');
    if (!ctrl || ctrl.disabled || !(ctrl.touched || ctrl.dirty)) return '';
    if (ctrl.hasError('invalidIsbtFormat')) return 'Date must be in format DD-MMM-YYYY HH:mm (e.g., 02-FEB-2025 05:30)';
    return '';
  }

  getShippedDateError(): string {
    const ctrl = this.form.get('shippedDate');
    if (!ctrl || !(ctrl.touched || ctrl.dirty)) return '';
    if (ctrl.hasError('matDatepickerParse')) return 'Shipped Date is invalid';
    return '';
  }

  getTempError(): string {
    const minVal = this.form.get('minTemp')?.value;
    const maxVal = this.form.get('maxTemp')?.value;
    if (minVal != null && maxVal != null && Number(minVal) > Number(maxVal)) {
      return 'Min temp must be ≤ Max temp';
    }
    return '';
  }

  // ── Temperature Input ──

  onTempKeyDown(event: KeyboardEvent): void {
    const allowed = [
      'Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight',
      'ArrowUp', 'ArrowDown', 'Home', 'End', 'Escape', 'Enter',
      'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
      '.', '-',
    ];
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (!allowed.includes(event.key)) {
      event.preventDefault();
    }
  }

  // ── Date Input Handlers ──

  onShippedDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('shippedDate')
    );
  }

  // ── Date Display ──

  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    return DateFieldValidationUtility.formatDateForUI(new Date(date)) || '-';
  }

  formatDateTime(date: string | null | undefined): string {
    return DateFieldValidationUtility.formatDateTimeForUI(date) || '-';
  }

  // ── Cancel ──

  onCancel(): void {
    if (this.originalBatchData) {
      this.populateForm(this.originalBatchData);
    }
  }

  // ── Save ──

  onSave(): void {
    if (!this.isFormValid || this.isSaving || !this.selectedBatch) return;

    const dialogRef = this.dialog.open(BatchNotesDialogComponent, {
      width: '500px',
      disableClose: true,
      data: {
        noteText: this.selectedBatch.noteText || '',
      } as BatchNotesDialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: string | null) => {
        if (result === null) return;
        this.submitUpdate(result);
      });
  }

  private submitUpdate(noteText: string): void {
    if (!this.selectedBatch) return;

    this.isSaving = true;

    const formVal = this.form.getRawValue();

    const receivedDateCtrl = this.form.get('receivedDate')!;
    const receivedDateValue = receivedDateCtrl.disabled
      ? (this.selectedBatch.receivedDate ?? null)
      : (formVal.receivedDate ? this.convertIsbtToApiFormat(formVal.receivedDate) : null);

    const qcDateCtrl = this.form.get('qcDate')!;
    const qcDateValue = qcDateCtrl.disabled
      ? (this.selectedBatch.qcDate ?? null)
      : (formVal.qcDate ? this.convertIsbtToApiFormat(formVal.qcDate) : null);

    const resultsQcDateCtrl = this.form.get('resultsQcDate')!;
    const resultsQcDateValue = resultsQcDateCtrl.disabled
      ? (this.selectedBatch.resultsQcDate ?? null)
      : (formVal.resultsQcDate ? this.convertIsbtToApiFormat(formVal.resultsQcDate) : null);

    const request: MaintainBatchDataUpdateRequestDto = {
      batchId: this.selectedBatch.batchId!,
      receivedDate: receivedDateValue,
      shippedDate: DateFieldValidationUtility.serializeDateForApi(
        formVal.shippedDate
      ),
      maxTemp: formVal.maxTemp != null ? Number(formVal.maxTemp) : null,
      minTemp: formVal.minTemp != null ? Number(formVal.minTemp) : null,
      qcDate: qcDateValue,
      resultsQcDate: resultsQcDateValue,
      noteText: noteText?.trim() || null,
      cartonCount: this.selectedBatch.cartonCount,
    };

    this.batchService
      .updateBatch(request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isSaving = false))
      )
      .subscribe({
        next: (response) => {
          this.snackbarService.showSuccess(response.message);
          this.reloadBatchData();
        },
        error: (error) => {
          const message =
            error?.error?.errorResponse?.error ||
            error?.error?.message ||
            'An error occurred while updating the batch data. Please try again.';
          this.snackbarService.showError(message);
        },
      });
  }

  preventComma(event: KeyboardEvent): void {
    if (event.key === ',') {
      event.preventDefault();
    }
  }

  onDateTimeKeydown(event: KeyboardEvent, controlName: string): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onDateTimeBlur(controlName);
    }
  }

  onDateTimeBlur(controlName: string): void {
    const ctrl = this.form.get(controlName);
    if (!ctrl || !ctrl.value) return;

    const value = ctrl.value.trim().toUpperCase();
    const dateOnlyRegex = /^(0[1-9]|[12][0-9]|3[01])-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-\d{4}$/;

    if (dateOnlyRegex.test(value)) {
      ctrl.setValue(value + ' 00:00');
      ctrl.markAsDirty();
      return;
    }

    const dateWithRawTimeRegex = /^((0[1-9]|[12][0-9]|3[01])-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-\d{4})\s+(\d{1,4})$/;
    const match = value.match(dateWithRawTimeRegex);
    if (!match) return;

    const datePart = match[1];
    const timeDigits = match[4];
    let hours: string;
    let minutes: string;

    switch (timeDigits.length) {
      case 1:
        hours = timeDigits.padStart(2, '0');
        minutes = '00';
        break;
      case 2:
        hours = timeDigits;
        minutes = '00';
        break;
      case 3:
        hours = timeDigits.substring(0, 1).padStart(2, '0');
        minutes = timeDigits.substring(1);
        break;
      case 4:
        hours = timeDigits.substring(0, 2);
        minutes = timeDigits.substring(2);
        break;
      default:
        return;
    }

    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      ctrl.setValue(`${datePart} ${hours}:${minutes}`);
      ctrl.markAsDirty();
    }
  }

  private convertIsbtToApiFormat(isbtDateTime: string): string {
    if (!isbtDateTime) return '';

    let datePart: string;
    let timePart: string;

    if (isbtDateTime.includes(', ')) {
      [datePart, timePart] = isbtDateTime.split(', ');
    } else {
      const parts = isbtDateTime.split(' ');
      datePart = parts[0];
      timePart = parts[1];
    }

    const [day, mon, year] = datePart.split('-');
    const [hour, minute] = timePart.split(':');

    const monthMap: Record<string, number> = {
      JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
      JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
    };

    const monthIndex = monthMap[mon.toUpperCase()];

    return moment()
      .year(Number(year))
      .month(monthIndex)
      .date(Number(day))
      .hour(Number(hour))
      .minute(Number(minute))
      .second(0)
      .format('YYYY-MM-DD HH:mm');
  }

  private reloadBatchData(): void {
    if (!this.selectedBatch?.batchId) return;

    this.isLoadingBatch = true;
    this.batchService
      .getBatchById(this.selectedBatch.batchId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoadingBatch = false))
      )
      .subscribe({
        next: (batch) => {
          if (batch) {
            this.selectedBatch = batch;
            this.originalBatchData = { ...batch };
            this.populateForm(batch);
          }
        },
      });
  }
}
