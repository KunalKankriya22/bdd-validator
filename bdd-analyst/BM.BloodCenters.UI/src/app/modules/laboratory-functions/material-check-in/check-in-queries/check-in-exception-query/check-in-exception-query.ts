import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { CheckInExceptionQueryService } from './services/check-in-exception-query.service';
import {
  TubeOnlyUnit,
  NoBagUnit,
  CheckInExceptionQueryRequest
} from './models/check-in-exception-query.model';

@Component({
  selector: 'app-check-in-exception-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatIconModule,
    PageHeaderWithBreadcrumb
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './check-in-exception-query.html',
  styleUrls: ['./check-in-exception-query.scss']
})
export class CheckInExceptionQuery implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `check-in-exception-query-${CheckInExceptionQuery.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly checkInService = inject(CheckInExceptionQueryService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);

  private startDateRawInput = '';
  private endDateRawInput = '';

  protected readonly tubesOnlyData = signal<TubeOnlyUnit[]>([]);
  protected readonly noBagData = signal<NoBagUnit[]>([]);
  protected readonly filteredTubesOnly = signal<TubeOnlyUnit[]>([]);
  protected readonly filteredNoBag = signal<NoBagUnit[]>([]);
  protected readonly totalTubesOnly = signal<number>(0);
  protected readonly totalNoBag = signal<number>(0);
  private readonly originalTotalTubesOnly = signal<number>(0);
  private readonly originalTotalNoBag = signal<number>(0);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal<boolean>(false);
  private datesChanged = true;
  protected readonly tubesOnlySearchText = signal<string>('');
  protected readonly noBagSearchText = signal<string>('');

  protected readonly hasResults = computed(() =>
    this.tubesOnlyData().length > 0 || this.noBagData().length > 0
  );
  protected readonly isReady = computed(() => !this.loading() && !this.error());

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  form!: FormGroup;

  tubesOnlySortField: string | null = null;
  tubesOnlySortDirection: 'ASC' | 'DESC' = 'ASC';
  noBagSortField: string | null = null;
  noBagSortDirection: 'ASC' | 'DESC' = 'ASC';

  get today() {
    return this.chapterTimezoneService.getChapterLocalDate();
  }

  private destroy$ = new Subject<void>();

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

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      startDate: [null, [Validators.required, this.futureDateValidator()]],
      endDate: [null, [Validators.required, this.futureDateValidator()]]
    }, {
      validators: [this.endDateAfterStartDateValidator()]
    });
  }

  private futureDateValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const selectedDate = moment.isMoment(value) ? value : moment(value);
      const todayDate = this.chapterTimezoneService.getChapterLocalDate().startOf('day');

      if (selectedDate.startOf('day').isAfter(todayDate)) {
        return { futureDate: true };
      }

      return null;
    };
  }

  private endDateAfterStartDateValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const startDateControl = control.get('startDate');
      const endDateControl = control.get('endDate');

      if (!startDateControl || !endDateControl) return null;

      const startDate = startDateControl.value;
      const endDate = endDateControl.value;

      if (!startDate || !endDate) {
        this.clearEndDateError(endDateControl);
        return null;
      }

      const start = moment.isMoment(startDate) ? startDate : moment(startDate);
      const end = moment.isMoment(endDate) ? endDate : moment(endDate);

      if (moment(end).startOf('day').isBefore(moment(start).startOf('day'))) {
        const currentErrors = endDateControl.errors || {};
        endDateControl.setErrors({ ...currentErrors, endBeforeStart: true });
        return null;
      }

      this.clearEndDateError(endDateControl);
      return null;
    };
  }

  private clearEndDateError(control: AbstractControl): void {
    if (control.hasError('endBeforeStart')) {
      const errors = { ...control.errors };
      delete errors['endBeforeStart'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  get f() {
    return this.form.controls;
  }

  get isRetrieveDisabled(): boolean {
    return this.loading() || this.form.invalid || !this.datesChanged;
  }

  get isClearAllDisabled(): boolean {
    return !this.form.get('startDate')?.value && !this.form.get('endDate')?.value && !this.hasResults();
  }

  onDateChange(): void {
    this.datesChanged = true;
    this.form.updateValueAndValidity();
  }

  onStartDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.startDateRawInput = input.value.trim();
    const control = this.form.get('startDate');
    if (!control) return;
    control.markAsDirty();
    control.markAsTouched();
    this.onDateChange();
    setTimeout(() => {
      if (this.startDateRawInput && !control.value) {
        control.setErrors({ ...control.errors, invalidDate: true });
      }
    }, 0);
  }

  onStartDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.form.get('startDate');
      if (!control) return;
      control.markAsTouched();
      const controlValue = control.value;
      const inputValue = input.value.trim();

      if (controlValue && typeof controlValue === 'object' && controlValue.isValid && controlValue.isValid()) {
        const formattedDate = DateFieldValidationUtility.formatDateForUI(controlValue);
        input.value = formattedDate;
        this.startDateRawInput = formattedDate;
        if (control.hasError('invalidDate')) {
          const { invalidDate, ...rest } = control.errors || {};
          control.setErrors(Object.keys(rest).length ? rest : null);
        }
      } else if (inputValue && !controlValue) {
        input.value = this.startDateRawInput;
        if (!control.hasError('invalidDate')) {
          control.setErrors({ ...control.errors, invalidDate: true });
        }
      } else if (!inputValue) {
        if (control.hasError('invalidDate')) {
          const { invalidDate, ...rest } = control.errors || {};
          control.setErrors(Object.keys(rest).length ? rest : null);
        }
      }
    }, 0);
  }

  getStartDateError(): string {
    const control = this.form.get('startDate');
    if (!control) return '';
    if (control.hasError('invalidDate')) return 'Start Date is invalid';
    if (control.hasError('matDatepickerParse')) return 'Start Date is invalid';
    if (control.hasError('futureDate')) return 'From Date cannot be a future date';
    if (control.hasError('required') && (control.touched || this.submitted())) return 'Start Date is required';
    return '';
  }

  onEndDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.endDateRawInput = input.value.trim();
    const control = this.form.get('endDate');
    if (!control) return;
    control.markAsDirty();
    control.markAsTouched();
    this.onDateChange();
    setTimeout(() => {
      if (this.endDateRawInput && !control.value) {
        control.setErrors({ ...control.errors, invalidDate: true });
      }
    }, 0);
  }

  onEndDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.form.get('endDate');
      if (!control) return;
      control.markAsTouched();
      const controlValue = control.value;
      const inputValue = input.value.trim();

      if (controlValue && typeof controlValue === 'object' && controlValue.isValid && controlValue.isValid()) {
        const formattedDate = DateFieldValidationUtility.formatDateForUI(controlValue);
        input.value = formattedDate;
        this.endDateRawInput = formattedDate;
        if (control.hasError('invalidDate')) {
          const { invalidDate, ...rest } = control.errors || {};
          control.setErrors(Object.keys(rest).length ? rest : null);
        }
      } else if (inputValue && !controlValue) {
        input.value = this.endDateRawInput;
        if (!control.hasError('invalidDate')) {
          control.setErrors({ ...control.errors, invalidDate: true });
        }
      } else if (!inputValue) {
        if (control.hasError('invalidDate')) {
          const { invalidDate, ...rest } = control.errors || {};
          control.setErrors(Object.keys(rest).length ? rest : null);
        }
      }
    }, 0);
  }

  getEndDateError(): string {
    const control = this.form.get('endDate');
    if (!control) return '';
    if (control.hasError('invalidDate')) return 'End Date is invalid';
    if (control.hasError('matDatepickerParse')) return 'End Date is invalid';
    if (control.hasError('futureDate')) return 'To Date cannot be a future date';
    if (control.hasError('endBeforeStart')) return 'To Date must be greater than or equal to From Date';
    if (control.hasError('required') && (control.touched || this.submitted())) return 'End Date is required';
    return '';
  }

  onRetrieve(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    const formValue = this.form.value;
    const request: CheckInExceptionQueryRequest = {
      fromDate: this.checkInService.formatDateForApi(formValue.startDate),
      toDate: this.checkInService.formatDateForApi(formValue.endDate)
    };

    this.checkInService.queryCheckInExceptions(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.tubesOnlyData.set(result.tubesOnlyCheckedIn);
          this.noBagData.set(result.noBagCheckedIn);
          this.filteredTubesOnly.set(result.tubesOnlyCheckedIn);
          this.filteredNoBag.set(result.noBagCheckedIn);
          this.totalTubesOnly.set(result.totalTubesOnly);
          this.totalNoBag.set(result.totalNoBag);
          this.originalTotalTubesOnly.set(result.totalTubesOnly);
          this.originalTotalNoBag.set(result.totalNoBag);
          this.datesChanged = false;
          this.loading.set(false);

          if (result.totalTubesOnly === 0 && result.totalNoBag === 0) {
            this.snackbarService.showError('No records found for the specified date range');
          }
        },
        error: (err) => {
          this.handleApiError(err);
          this.loading.set(false);
        }
      });
  }

  private handleApiError(error: HttpErrorResponse): void {
    let errorMessage = 'Failed to retrieve check-in exceptions';

    if (error.error?.errorResponse?.error) {
      errorMessage = error.error.errorResponse.error;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    this.error.set(errorMessage);
  }

  onClearAll(): void {
    this.form.reset({ startDate: null, endDate: null });
    this.tubesOnlyData.set([]);
    this.noBagData.set([]);
    this.filteredTubesOnly.set([]);
    this.filteredNoBag.set([]);
    this.totalTubesOnly.set(0);
    this.totalNoBag.set(0);
    this.originalTotalTubesOnly.set(0);
    this.originalTotalNoBag.set(0);
    this.tubesOnlySearchText.set('');
    this.noBagSearchText.set('');
    this.submitted.set(false);
    this.error.set(null);
    this.datesChanged = true;
    this.startDateRawInput = '';
    this.endDateRawInput = '';
  }

  onTubesOnlySearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchText = input.value.toLowerCase().trim();
    this.tubesOnlySearchText.set(searchText);

    if (!searchText) {
      this.filteredTubesOnly.set(this.tubesOnlyData());
      this.totalTubesOnly.set(this.originalTotalTubesOnly());
      return;
    }

    const filtered = this.tubesOnlyData().filter(unit => unit.unitId.toLowerCase().includes(searchText));
    this.filteredTubesOnly.set(filtered);
    this.totalTubesOnly.set(filtered.length);
  }

  onNoBagSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchText = input.value.toLowerCase().trim();
    this.noBagSearchText.set(searchText);

    if (!searchText) {
      this.filteredNoBag.set(this.noBagData());
      this.totalNoBag.set(this.originalTotalNoBag());
      return;
    }

    const filtered = this.noBagData().filter(unit => unit.unitId.toLowerCase().includes(searchText));
    this.filteredNoBag.set(filtered);
    this.totalNoBag.set(filtered.length);
  }

  onSortChange(table: 'tubesOnly' | 'noBag', column: string): void {
    if (table === 'tubesOnly') {
      if (this.tubesOnlySortField === column) {
        this.tubesOnlySortDirection = this.tubesOnlySortDirection === 'ASC' ? 'DESC' : 'ASC';
      } else {
        this.tubesOnlySortField = column;
        this.tubesOnlySortDirection = 'ASC';
      }
      this.applySortTubesOnly();
    } else {
      if (this.noBagSortField === column) {
        this.noBagSortDirection = this.noBagSortDirection === 'ASC' ? 'DESC' : 'ASC';
      } else {
        this.noBagSortField = column;
        this.noBagSortDirection = 'ASC';
      }
      this.applySortNoBag();
    }
  }

  getSortIcon(table: 'tubesOnly' | 'noBag', column: string): string {
    const field = table === 'tubesOnly' ? this.tubesOnlySortField : this.noBagSortField;
    const direction = table === 'tubesOnly' ? this.tubesOnlySortDirection : this.noBagSortDirection;

    if (field !== column) return 'unfold_more';
    return direction === 'ASC' ? 'arrow_upward' : 'arrow_downward';
  }

  private applySortTubesOnly(): void {
    const data = [...this.filteredTubesOnly()];
    const isAsc = this.tubesOnlySortDirection === 'ASC';

    data.sort((a, b) => {
      if (this.tubesOnlySortField === 'unitId') {
        return (a.unitId < b.unitId ? -1 : 1) * (isAsc ? 1 : -1);
      }
      if (this.tubesOnlySortField === 'date') {
        return (new Date(a.tubeCheckInDate).getTime() - new Date(b.tubeCheckInDate).getTime()) * (isAsc ? 1 : -1);
      }
      return 0;
    });

    this.filteredTubesOnly.set(data);
  }

  private applySortNoBag(): void {
    const data = [...this.filteredNoBag()];
    const isAsc = this.noBagSortDirection === 'ASC';

    data.sort((a, b) => {
      if (this.noBagSortField === 'tubeId') {
        return (a.unitId < b.unitId ? -1 : 1) * (isAsc ? 1 : -1);
      }
      if (this.noBagSortField === 'date') {
        return (new Date(a.collectionDate).getTime() - new Date(b.collectionDate).getTime()) * (isAsc ? 1 : -1);
      }
      return 0;
    });

    this.filteredNoBag.set(data);
  }
}
