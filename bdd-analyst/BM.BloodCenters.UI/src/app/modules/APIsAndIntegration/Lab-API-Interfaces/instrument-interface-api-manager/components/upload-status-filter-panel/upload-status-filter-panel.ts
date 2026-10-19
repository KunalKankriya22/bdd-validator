import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  OnDestroy,
  ViewChild,
  ElementRef,
  computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { InstrumentInterfaceService } from '../../services/instrument-interface.service';
import { Subject, takeUntil } from 'rxjs';

export interface UploadStatusFilterValue {
  fileId: string | null;
  testBatchId: string | null;
  status: string | null;
  period: string | null;
  processDate: Date | null;
}

@Component({
  selector: 'app-upload-status-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './upload-status-filter-panel.html',
  styleUrls: ['./upload-status-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadStatusFilterPanel implements OnInit, OnDestroy {
  @ViewChild('processDateInput') processDateInput?: ElementRef<HTMLInputElement>;

  @Input() currentFilters: UploadStatusFilterValue | null = null;
  @Input() chapterId: string = '';
  @Input() instrumentId: string = '';
  @Input() uploadStatusList: any[] = [];
  @Input() statusOptions: { value: string; label: string }[] = [];
  @Output() apply = new EventEmitter<UploadStatusFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  hasChanges = false;
  hasActiveFilters = false;

  periodOptions = [
    { value: 'after', display: 'After' },
    { value: 'before', display: 'Before' }
  ];

  fileIdOptions: string[] = [];
  testBatchIdOptions: string[] = [];
  loadingFileIds = false;
  loadingTestBatchIds = false;

  // Search controls for searchable dropdowns
  readonly fileIdSearchControl = new FormControl('');
  readonly testBatchIdSearchControl = new FormControl('');
  readonly statusSearchControl = new FormControl('');

  private readonly fileIdSearch = signal('');
  private readonly testBatchIdSearch = signal('');
  private readonly statusSearch = signal('');

  readonly filteredFileIds = computed(() => {
    const search = this.fileIdSearch().toLowerCase();
    if (!search) return this.fileIdOptions;
    return this.fileIdOptions.filter(id => id.toLowerCase().includes(search));
  });

  readonly filteredTestBatchIds = computed(() => {
    const search = this.testBatchIdSearch().toLowerCase();
    if (!search) return this.testBatchIdOptions;
    return this.testBatchIdOptions.filter(id => id.toLowerCase().includes(search));
  });

  readonly filteredStatusOptions = computed(() => {
    const search = this.statusSearch().toLowerCase();
    if (!search) return this.statusOptions;
    return this.statusOptions.filter(o => o.label.toLowerCase().includes(search));
  });

  private appliedFilterSnapshot!: string;
  private destroy$ = new Subject<void>();
  private processDateRawInput = '';

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private instrumentService: InstrumentInterfaceService
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      fileId: [this.currentFilters?.fileId || null],
      testBatchId: [this.currentFilters?.testBatchId || null],
      status: [this.currentFilters?.status || null],
      period: [this.currentFilters?.period || null],
      processDate: [this.currentFilters?.processDate || null]
    });

    this.appliedFilterSnapshot = this.normalizeFormValue(this.filterForm.value);
    this.hasActiveFilters = this.checkHasActiveFilters();

    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.hasChanges = this.normalizeFormValue(this.filterForm.value) !== this.appliedFilterSnapshot;
        this.hasActiveFilters = this.checkHasActiveFilters();
        this.cdr.markForCheck();
      });

    // Period validation when date changes
    this.filterForm.get('processDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validatePeriod());

    this.filterForm.get('period')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validatePeriod());

    // Wire up search controls to signals
    this.fileIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.fileIdSearch.set(value || ''));

    this.testBatchIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.testBatchIdSearch.set(value || ''));

    this.statusSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.statusSearch.set(value || ''));

    this.loadFileIds();
    this.loadTestBatchIds();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private validatePeriod(): void {
    const processDate = this.filterForm.get('processDate')?.value;
    const period = this.filterForm.get('period')?.value;
    const periodControl = this.filterForm.get('period');

    if (processDate && !period) {
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();
    } else {
      periodControl?.setErrors(null);
    }
  }

  private normalizeFormValue(formValue: UploadStatusFilterValue): string {
    return JSON.stringify({
      fileId: formValue.fileId || null,
      testBatchId: formValue.testBatchId || null,
      status: formValue.status || null,
      period: formValue.period || null,
      processDate: formValue.processDate ? String(formValue.processDate) : null
    });
  }

  private checkHasActiveFilters(): boolean {
    const v = this.filterForm.value;
    const hasProcessDateFilter = !!(v.period && v.processDate);
    return !!(v.fileId || v.testBatchId || v.status || hasProcessDateFilter);
  }

  loadFileIds(): void {
    if (this.uploadStatusList?.length > 0) {
      this.fileIdOptions = [...new Set(this.uploadStatusList.map((item: any) => item.fileId))]
        .filter(Boolean).sort();
      this.loadingFileIds = false;
      this.cdr.markForCheck();
      return;
    }

    if (!this.chapterId || !this.instrumentId) return;

    this.loadingFileIds = true;
    this.instrumentService.getFileIds(this.chapterId, this.instrumentId, 'upload_status')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.fileIdOptions = response.data?.map((item: any) => item.fileId || item) || [];
          this.loadingFileIds = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingFileIds = false;
          this.cdr.markForCheck();
        }
      });
  }

  loadTestBatchIds(): void {
    if (this.uploadStatusList?.length > 0) {
      this.testBatchIdOptions = [...new Set(this.uploadStatusList.map((item: any) => item.ltTbId))]
        .filter(Boolean).sort();
      this.loadingTestBatchIds = false;
      this.cdr.markForCheck();
      return;
    }

    if (!this.chapterId || !this.instrumentId) return;

    this.loadingTestBatchIds = true;
    this.instrumentService.getTestBatchIds(this.chapterId, this.instrumentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.testBatchIdOptions = response.data?.map((item: any) => item.ltTbId || item) || [];
          this.loadingTestBatchIds = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingTestBatchIds = false;
          this.cdr.markForCheck();
        }
      });
  }

  onProcessDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value.trim();
    this.processDateRawInput = inputValue;

    const control = this.filterForm.get('processDate');
    if (!control) return;

    control.markAsDirty();
    control.markAsTouched();

    setTimeout(() => {
      if (inputValue && !control.value) {
        control.setErrors({ ...control.errors, invalidDate: true });
      }
      this.cdr.markForCheck();
    }, 0);
  }

  onProcessDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('processDate');
      if (!control) return;

      control.markAsTouched();
      const controlValue = control.value;
      const inputValue = input.value.trim();

      if (controlValue && typeof controlValue === 'object' && controlValue.isValid?.()) {
        const formatted = DateFieldValidationUtility.formatDateForUI(controlValue).toUpperCase();
        input.value = formatted;
        this.processDateRawInput = formatted;
        control.setErrors(null);
      } else if (inputValue && !controlValue) {
        input.value = this.processDateRawInput;
        if (!control.hasError('invalidDate')) {
          control.setErrors({ invalidDate: true });
        }
      } else if (!inputValue) {
        control.setErrors(null);
      }

      this.cdr.markForCheck();
    }, 0);
  }

  getProcessDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.filterForm.get('processDate'),
      this.filterForm.errors,
      'Process Date'
    );
  }

  getPeriodError(): string {
    const control = this.filterForm.get('period');
    if (control?.hasError('required') && control?.touched) return 'Period is required';
    return '';
  }

  onApply(): void {
    this.filterForm.markAllAsTouched();
    this.validatePeriod();

    if (this.filterForm.invalid) return;

    const v = this.filterForm.value;
    const period = v.processDate ? (v.period || null) : null;

    const filters: UploadStatusFilterValue = {
      fileId: v.fileId || null,
      testBatchId: v.testBatchId || null,
      status: v.status || null,
      period,
      processDate: v.processDate || null
    };

    this.appliedFilterSnapshot = this.normalizeFormValue(this.filterForm.value);
    this.hasChanges = false;
    this.cdr.markForCheck();

    this.apply.emit(filters);
  }

  onClear(): void {
    this.fileIdSearchControl.setValue('');
    this.testBatchIdSearchControl.setValue('');
    this.statusSearchControl.setValue('');
    this.filterForm.reset({
      fileId: null,
      testBatchId: null,
      status: null,
      period: null,
      processDate: null
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
