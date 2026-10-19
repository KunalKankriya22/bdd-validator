import {
  Component,
  EventEmitter,
  Output,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, DateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';
import { signal } from '@angular/core';

import { PlasmaFileTypeDto, XmlErrorLogFilterValue } from '../models/xml-error-log.model';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

@Component({
  selector: 'app-xml-error-log-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './xml-error-log-filter-panel.html',
  styleUrls: ['./xml-error-log-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
})
export class XmlErrorLogFilterPanel implements OnInit, OnDestroy {
  @ViewChild('logDateInput') logDateInput?: ElementRef<HTMLInputElement>;

  @Input() currentFilters: XmlErrorLogFilterValue | null = null;
  @Input() plasmaFileTypes: PlasmaFileTypeDto[] = [];

  @Output() apply = new EventEmitter<XmlErrorLogFilterValue>();
  @Output() close = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);

  filterForm!: FormGroup;

  maxDate!: Moment;
  plasmaFileTypeSearchCtrl = new FormControl('');
  filteredPlasmaFileTypes = signal<PlasmaFileTypeDto[]>([]);

  private destroy$ = new Subject<void>();
  private logDateRawInput = '';
  private initialFilterValues: XmlErrorLogFilterValue | null = null;

  ngOnInit(): void {
    this.initializeForm();
    this.maxDate = this.chapterTimezoneService.getChapterLocalDate();
    this.filteredPlasmaFileTypes.set(this.plasmaFileTypes);

    if (this.currentFilters) {
      this.populateFormWithCurrentFilters();
      this.initialFilterValues = { ...this.currentFilters };
    } else {
      this.initialFilterValues = null;
    }

    this.setupValidation();
    this.setupSearchFilter();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isApplyDisabled(): boolean {
    if (this.filterForm?.invalid) {
      return true;
    }

    if (this.hasDateErrors()) {
      return true;
    }

    if (this.getLogDateError()) {
      return true;
    }

    const formValue = this.filterForm?.value;
    if (!formValue) {
      return true;
    }

    const hasAnyValue = formValue.plasmaFileType || formValue.logDate;

    if (!hasAnyValue) {
      return true;
    }

    if (!this.hasFormChanged()) {
      return true;
    }

    return false;
  }

  onLogDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value.trim();
    this.logDateRawInput = inputValue;

    const control = this.filterForm.get('logDate');
    if (!control) return;

    control.markAsDirty();
    control.markAsTouched();

    setTimeout(() => {
      if (inputValue && !control.value) {
        control.setErrors({ ...control.errors, invalidDate: true });
      }
    }, 0);
  }

  onLogDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('logDate');
      if (!control) return;

      control.markAsTouched();

      const controlValue = control.value;
      const inputValue = input.value.trim();

      if (controlValue && typeof controlValue === 'object' && controlValue.isValid && controlValue.isValid()) {
        const formattedDate = DateFieldValidationUtility.formatDateForUI(controlValue);
        input.value = formattedDate;
        this.logDateRawInput = formattedDate;
        const isFuture = moment.isMoment(controlValue) && this.maxDate &&
          controlValue.clone().startOf('day').isAfter(this.maxDate.clone().startOf('day'));
        control.setErrors(isFuture ? { matDatepickerMax: true } : null);
      } else if (inputValue && !controlValue) {
        input.value = this.logDateRawInput;
        if (!control.hasError('invalidDate')) {
          control.setErrors({ invalidDate: true });
        }
      } else if (!inputValue) {
        control.setErrors(null);
      }
    }, 0);
  }

  getLogDateError(): string {
    const control = this.filterForm.get('logDate');
    if (!control) return '';

    if (control.hasError('invalidDate')) {
      return 'Date is invalid';
    }

    if (control.hasError('matDatepickerParse')) {
      return 'Date is invalid';
    }

    if (control.hasError('matDatepickerMax')) {
      return 'Date cannot be in future';
    }

    if (!(control.touched || control.dirty)) {
      return '';
    }

    return '';
  }

  onApply(): void {
    this.filterForm.markAllAsTouched();

    if (this.hasDateErrors()) {
      this.cdr.markForCheck();
      return;
    }

    const formValue = this.filterForm.value;

    const updatedFilters: XmlErrorLogFilterValue = {
      plasmaFileType: formValue.plasmaFileType || null,
      logDate: formValue.logDate ? this.formatDateOnly(formValue.logDate) : null,
    };

    this.apply.emit(updatedFilters);
  }

  onClear(): void {
    this.filterForm.reset({
      plasmaFileType: null,
      logDate: null,
    });
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      plasmaFileType: [null],
      logDate: [null],
    });
  }

  private setupValidation(): void {
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    this.filterForm.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  private populateFormWithCurrentFilters(): void {
    if (!this.currentFilters) return;

    const logDate = this.currentFilters.logDate
      ? moment.isMoment(this.currentFilters.logDate)
        ? this.currentFilters.logDate
        : moment(this.currentFilters.logDate)
      : null;

    this.filterForm.patchValue({
      plasmaFileType: this.currentFilters.plasmaFileType,
      logDate: logDate,
    });

    this.cdr.markForCheck();
  }

  private formatDateOnly(date: Moment | Date | null): string | null {
    if (!date) return null;

    if (moment.isMoment(date)) {
      return date.format('YYYY-MM-DD') + 'T00:00:00';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
  }

  private hasDateErrors(): boolean {
    const logDateControl = this.filterForm.get('logDate');
    return logDateControl?.hasError('invalidDate') ||
      logDateControl?.hasError('matDatepickerParse') ||
      logDateControl?.hasError('matDatepickerMax') || false;
  }

  private setupSearchFilter(): void {
    this.plasmaFileTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const search = this.plasmaFileTypeSearchCtrl.value?.toLowerCase() || '';
        if (!search) {
          this.filteredPlasmaFileTypes.set(this.plasmaFileTypes);
          return;
        }
        this.filteredPlasmaFileTypes.set(
          this.plasmaFileTypes.filter(t =>
            t.code.toLowerCase().includes(search) ||
            t.description.toLowerCase().includes(search),
          ),
        );
      });
  }

  private hasFormChanged(): boolean {
    const formValue = this.filterForm?.value;
    if (!formValue) return false;

    if (!this.initialFilterValues) return true;

    const currentLogDate = formValue.logDate ? this.formatDateOnly(formValue.logDate) : null;

    return formValue.plasmaFileType !== this.initialFilterValues.plasmaFileType ||
      currentLogDate !== this.initialFilterValues.logDate;
  }
}
