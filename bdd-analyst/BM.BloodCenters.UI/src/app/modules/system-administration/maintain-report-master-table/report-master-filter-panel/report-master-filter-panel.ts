import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { A11yModule } from '@angular/cdk/a11y';
import { TranslateModule } from '@ngx-translate/core';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { CustomDateAdapter, DD_MMM_YYYY_FORMAT, dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, take, takeUntil } from 'rxjs';

import { ReportMasterTableService } from '../services/report-master-table.service';
import { ReportMasterTableFilterValue } from '../models/report-master-table.model';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

@Component({
  selector: 'app-report-master-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    A11yModule,
    TranslateModule,
    NgxMatSelectSearchModule,
    FilterPanelBase
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MMM_YYYY_FORMAT }
  ],
  templateUrl: './report-master-filter-panel.html',
  styleUrls: ['./report-master-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportMasterFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: ReportMasterTableFilterValue | null = null;
  @Output() apply = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  typeOptions: string[] = [];
  filteredTypeOptions: string[] = [];
  typeSearchControl = new FormControl('');

  chapterOptions: string[] = [];
  filteredChapterOptions: string[] = [];
  chapterSearchControl = new FormControl('');

  warehouseOptions: { code: string; label: string }[] = [];
  periodOptions: string[] = ['After', 'Before'];

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';
  filteredWarehouseOptions: { code: string; label: string }[] = [];
  warehouseSearchControl = new FormControl('');

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private service: ReportMasterTableService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      type: [null],
      chapterId: [null],
      warehouse: [null],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [this.currentFilters?.effectiveDate || null, [dateFormatValidator()]],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [this.currentFilters?.terminationDate || null, [dateFormatValidator()]]
    });

    // Setup validation listeners for effective date
    this.filterForm.get('effectiveDate')?.valueChanges.subscribe((date) => {
      const control = this.filterForm.get('effectiveDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      this.validateEffectiveDatePeriod();
    });

    this.filterForm.get('effectiveDatePeriod')?.valueChanges.subscribe(() => {
      this.validateEffectiveDatePeriod();
    });

    // Setup validation listeners for termination date
    this.filterForm.get('terminationDate')?.valueChanges.subscribe((date) => {
      const control = this.filterForm.get('terminationDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      this.validateTerminationDatePeriod();
    });

    this.filterForm.get('terminationDatePeriod')?.valueChanges.subscribe(() => {
      this.validateTerminationDatePeriod();
    });

    this.loadFilters();
    this.setupSearchControls();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchControls(): void {
    // Type search
    this.typeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredTypeOptions = this.typeOptions.filter(option =>
          option.toLowerCase().includes(term)
        );
      });

    // Chapter ID search
    this.chapterSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredChapterOptions = this.chapterOptions.filter(option =>
          option.toLowerCase().includes(term)
        );
      });

    // Warehouse search
    this.warehouseSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredWarehouseOptions = this.warehouseOptions.filter(option =>
          option.code.toLowerCase().includes(term) ||
          option.label.toLowerCase().includes(term)
        );
      });
  }

  private loadFilters(): void {
    this.service.getReportMasterTableFilters()
      .pipe(take(1))
      .subscribe(response => {
        const data = response.data?.[0];

        this.typeOptions = data?.type ?? [];
        this.filteredTypeOptions = [...this.typeOptions];

        this.chapterOptions = data?.chapterID ?? [];
        this.filteredChapterOptions = [...this.chapterOptions];

        const warehouseCodes: string[] = data?.warehouse ?? [];
        const warehouseDisplay: string[] = data?.warehouseDisplay ?? [];
        this.warehouseOptions = warehouseCodes.map((code, index) => ({
          code,
          label: warehouseDisplay[index] || code
        }));
        this.filteredWarehouseOptions = [...this.warehouseOptions];

        if (this.currentFilters) {
          this.filterForm.patchValue({
            type: this.currentFilters.type,
            chapterId: this.currentFilters.chapterId,
            warehouse: this.currentFilters.warehouse,
            effectiveDatePeriod: this.currentFilters.effectiveDatePeriod,
            effectiveDate: this.currentFilters.effectiveDate,
            terminationDatePeriod: this.currentFilters.terminationDatePeriod,
            terminationDate: this.currentFilters.terminationDate
          });
        }
      });
  }

  private validateEffectiveDatePeriod(): void {
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const effectiveDatePeriod = this.filterForm.get('effectiveDatePeriod')?.value;
    const effectiveDatePeriodControl = this.filterForm.get('effectiveDatePeriod');

    if (effectiveDate && !effectiveDatePeriod) {
      effectiveDatePeriodControl?.setErrors({ required: true });
      effectiveDatePeriodControl?.markAsTouched();
    } else {
      effectiveDatePeriodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  private validateTerminationDatePeriod(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationDatePeriod = this.filterForm.get('terminationDatePeriod')?.value;
    const terminationDatePeriodControl = this.filterForm.get('terminationDatePeriod');

    if (terminationDate && !terminationDatePeriod) {
      terminationDatePeriodControl?.setErrors({ required: true });
      terminationDatePeriodControl?.markAsTouched();
    } else {
      terminationDatePeriodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  onApply(): void {
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    const effectiveDatePeriodControl = this.filterForm.get('effectiveDatePeriod');
    const terminationDatePeriodControl = this.filterForm.get('terminationDatePeriod');

    // Prevent apply if any validation errors exist
    if (effectiveDateControl?.errors ||
        terminationDateControl?.errors ||
        effectiveDatePeriodControl?.errors ||
        terminationDatePeriodControl?.errors) {
      // Mark all controls as touched to show all errors
      effectiveDateControl?.markAsTouched();
      terminationDateControl?.markAsTouched();
      effectiveDatePeriodControl?.markAsTouched();
      terminationDatePeriodControl?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const formValue = this.filterForm.value;
    const filters: ReportMasterTableFilterValue = {
      type: formValue.type || null,
      chapterId: formValue.chapterId || null,
      warehouse: formValue.warehouse || null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: formValue.effectiveDate,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: formValue.terminationDate
    };
    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      type: null,
      chapterId: null,
      warehouse: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';

    this.filterForm.get('effectiveDatePeriod')?.setErrors(null);
    this.filterForm.get('terminationDatePeriod')?.setErrors(null);

    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    // Check if at least one field has a value
    const hasAnyValue =
      (formValue.type !== null && formValue.type !== '') ||
      (formValue.chapterId !== null && formValue.chapterId !== '') ||
      (formValue.warehouse !== null && formValue.warehouse !== '') ||
      formValue.effectiveDate ||
      formValue.terminationDate;

    if (!hasAnyValue) {
      return true;
    }

    // Check for validation errors
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    const effectiveDatePeriodControl = this.filterForm.get('effectiveDatePeriod');
    const terminationDatePeriodControl = this.filterForm.get('terminationDatePeriod');

    const hasDateErrors = (effectiveDateControl?.invalid ?? false) || (terminationDateControl?.invalid ?? false);
    const hasPeriodErrors = (effectiveDatePeriodControl?.invalid ?? false) || (terminationDatePeriodControl?.invalid ?? false);

    return hasDateErrors || hasPeriodErrors;
  }

  /**
   * Handle input event for effective date field
   * - Store raw input text
   * - Mark control as touched to show errors
   * - Trigger validation
   */
  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value.trim();
    this.effectiveDateRawInput = inputValue;

    const control = this.filterForm.get('effectiveDate');
    if (!control) return;

    // Mark as dirty and touched so validation errors are shown
    control.markAsDirty();
    control.markAsTouched();

    // If user has typed something but control value is null/empty after parsing,
    // it means the date format is invalid
    setTimeout(() => {
      if (inputValue && !control.value) {
        // DateAdapter couldn't parse the input - mark as invalid
        control.setErrors({ invalidDateFormat: true });
      }
      this.cdr.markForCheck();
    }, 0);
  }

  /**
   * Handle blur event for effective date field
   * - If valid date: auto-convert to DD-MON-YYYY format
   * - If invalid date: restore typed text and show error
   */
  onEffectiveDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      if (!control) return;

      // Mark as touched to show validation errors
      control.markAsTouched();

      const controlValue = control.value;
      const inputValue = input.value.trim();

      if (controlValue instanceof Date && !isNaN(controlValue.getTime())) {
        // Valid date: auto-convert to DD-MON-YYYY format
        const formattedDate = DateFieldValidationUtility.formatDateForUI(controlValue);
        input.value = formattedDate;
        this.effectiveDateRawInput = formattedDate;
        // Clear any errors
        control.setErrors(null);
      } else if (inputValue && !controlValue) {
        // Invalid date: restore typed text and ensure error is set
        input.value = this.effectiveDateRawInput;
        control.setErrors({ invalidDateFormat: true });
      } else if (!inputValue) {
        // Empty field: clear errors
        control.setErrors(null);
        this.effectiveDateRawInput = '';
      }

      this.cdr.markForCheck();
    }, 0);
  }

  /**
   * Handle input event for termination date field
   * - Store raw input text
   * - Mark control as touched to show errors
   * - Trigger validation
   */
  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value.trim();
    this.terminationDateRawInput = inputValue;

    const control = this.filterForm.get('terminationDate');
    if (!control) return;

    // Mark as dirty and touched so validation errors are shown
    control.markAsDirty();
    control.markAsTouched();

    // If user has typed something but control value is null/empty after parsing,
    // it means the date format is invalid
    setTimeout(() => {
      if (inputValue && !control.value) {
        // DateAdapter couldn't parse the input - mark as invalid
        control.setErrors({ invalidDateFormat: true });
      }
      this.cdr.markForCheck();
    }, 0);
  }

  /**
   * Handle blur event for termination date field
   * - If valid date: auto-convert to DD-MON-YYYY format
   * - If invalid date: restore typed text and show error
   */
  onTerminationDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      if (!control) return;

      // Mark as touched to show validation errors
      control.markAsTouched();

      const controlValue = control.value;
      const inputValue = input.value.trim();

      if (controlValue instanceof Date && !isNaN(controlValue.getTime())) {
        // Valid date: auto-convert to DD-MON-YYYY format
        const formattedDate = DateFieldValidationUtility.formatDateForUI(controlValue);
        input.value = formattedDate;
        this.terminationDateRawInput = formattedDate;
        // Clear any errors
        control.setErrors(null);
      } else if (inputValue && !controlValue) {
        // Invalid date: restore typed text and ensure error is set
        input.value = this.terminationDateRawInput;
        control.setErrors({ invalidDateFormat: true });
      } else if (!inputValue) {
        // Empty field: clear errors
        control.setErrors(null);
        this.terminationDateRawInput = '';
      }

      this.cdr.markForCheck();
    }, 0);
  }
}
