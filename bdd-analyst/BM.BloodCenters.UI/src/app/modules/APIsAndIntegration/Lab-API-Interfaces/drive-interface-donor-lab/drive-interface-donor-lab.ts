import { Component, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, DateAdapter, ErrorStateMatcher } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil, interval, from, concatMap, catchError, of } from 'rxjs';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';

import { DriveInterfaceDonorLabApiService } from './services/drive-interface-donor-lab-api.service';
import {
  DriveInterfaceItem,
  TransferByOption,
  TransferProcessStatus,
  DriveInterfaceFilters
} from './models/drive-interface-donor-lab.model';
import { formatTableDate } from '@shared/utils/date-format.util';

@Component({
  selector: 'app-drive-interface-donor-lab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    DataTable
  ],
  templateUrl: './drive-interface-donor-lab.html',
  styleUrls: ['./drive-interface-donor-lab.scss'],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ]
})
export class DriveInterfaceDonorLabComponent implements OnInit, OnDestroy {
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/' }
    ],
    title: '',
    subtitle: '',
    actions: []
  };

  filterForm!: FormGroup;
  transferByOptions = signal<TransferByOption[]>([
    { code: 'All', description: 'All Drives' },
    { code: 'Specific', description: 'Specific' },
    { code: 'DateRange', description: 'Date Range' }
  ]);
  drives = signal<DriveInterfaceItem[]>([]);
  isLoadingDrives = signal(false);
  transferStatus = signal<TransferProcessStatus>({ status: 'idle' });
  showSearchField = signal(false);
  showDateFields = signal(false);
  selectedDrives = signal<DriveInterfaceItem[]>([]);
  currentSort = signal<{ column: string; direction: 'A' | 'D' }>({ column: 'sequence', direction: 'A' });
  driveIdError = signal<string>('');
  dateError = signal<string>('');

  startDateErrorMatcher: ErrorStateMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getStartDateError());
  endDateErrorMatcher: ErrorStateMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEndDateError());

  tableConfig = computed<DataTableConfig<DriveInterfaceItem>>(() => ({
    columns: [
      {
        key: 'sequence',
        header: 'Sequence',
        sortable: true,
        width: '160px'
      },
      {
        key: 'driveId',
        header: 'Drive ID',
        sortable: false,
        width: '200px'
      },
      {
        key: 'driveDate',
        header: 'Drive Date',
        sortable: false,
        width: 'auto',
        valueFormatter: (value: string) => formatTableDate(value)
      }
    ],
    enableSelection: false,
    showPagination: true,
    pageSize: 10,
    pageSizeOptions: [10, 25, 50, 100],
    sortConfig: {
      column: this.currentSort().column,
      direction: this.currentSort().direction
    }
  }));

  isTransferring = computed(() => this.transferStatus().status === 'processing');
  showSuccessMessage = computed(() => this.transferStatus().status === 'success');

  @ViewChild('driveIdInput') driveIdInput?: ElementRef<HTMLInputElement>;
  @ViewChild('filterTypeSelect') filterTypeSelect?: MatSelect;

  private destroy$ = new Subject<void>();
  private timerSubscription?: any;
  private transferErrors: { driveId: string; error: string }[] = [];
  private readonly MAX_DRIVE_ID_LENGTH = 15;
  private suppressBlur = false;

  constructor(
    private fb: FormBuilder,
    private apiService: DriveInterfaceDonorLabApiService,
    private snackBar: MatSnackBar,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    const pageData = this.pageHeaderService.pageHeaderData();
    if (pageData) {
      this.headerConfig = {
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: pageData.title, link: null }
        ],
        title: pageData.title,
        subtitle: pageData.subtitle || '',
        actions: []
      };
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      filterType: [''],
      driveId: [''],
      startDate: [null, [Validators.required]],
      endDate: [null, [Validators.required]]
    }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('startDate', 'endDate')] });
  }

  onTransferByChange(value: string): void {
    this.selectedDrives.set([]);
    this.driveIdError.set('');
    this.dateError.set('');
    this.transferStatus.set({ status: 'idle' });
    this.filterForm.get('driveId')?.setErrors(null);
    this.filterForm.get('startDate')?.setErrors(null);
    this.filterForm.get('endDate')?.setErrors(null);
    this.filterForm.get('startDate')?.markAsUntouched();
    this.filterForm.get('endDate')?.markAsUntouched();
    this.filterForm.get('startDate')?.updateValueAndValidity();
    this.filterForm.get('endDate')?.updateValueAndValidity();
    this.suppressBlur = true;

    if (value === 'All') {
      this.showSearchField.set(false);
      this.showDateFields.set(false);
      this.filterForm.patchValue({ driveId: '', startDate: null, endDate: null });
      this.loadDrives();
    } else if (value === 'Specific') {
      this.showSearchField.set(true);
      this.showDateFields.set(false);
      this.filterForm.patchValue({ driveId: '', startDate: null, endDate: null });
      this.drives.set([]);
    } else if (value === 'DateRange') {
      this.showSearchField.set(false);
      this.showDateFields.set(true);
      this.filterForm.patchValue({ driveId: '' });
      this.drives.set([]);
    }

    setTimeout(() => this.suppressBlur = false, 200);
  }

  onDriveIdInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const uppercaseValue = input.value.toUpperCase();

    this.filterForm.patchValue({ driveId: uppercaseValue }, { emitEvent: false });
    input.value = uppercaseValue;

    if (uppercaseValue.trim()) {
      this.driveIdError.set('');
      this.filterForm.get('driveId')?.setErrors(null);
    }
  }

  onDriveIdKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.searchAndAddDrive();
    }
  }

  onDriveIdBlur(): void {
    if (this.suppressBlur) return;
    const driveId = this.filterForm.get('driveId')?.value?.trim();
    if (driveId) {
      this.searchAndAddDrive();
    } else if (this.drives().length === 0) {
      this.setDriveIdError('Search Drive ID is required');
    }
  }

  private setDriveIdError(message: string): void {
    this.driveIdError.set(message);
    const control = this.filterForm.get('driveId');
    if (message) {
      control?.setErrors({ serverError: true });
      control?.markAsTouched();
    } else {
      control?.setErrors(null);
    }
  }

  private searchAndAddDrive(): void {
    const driveId = this.filterForm.get('driveId')?.value?.trim();

    if (!driveId) {
      this.setDriveIdError('Drive ID is required');
      return;
    }

    if (driveId.length > this.MAX_DRIVE_ID_LENGTH) {
      this.setDriveIdError(`Drive ID must not exceed ${this.MAX_DRIVE_ID_LENGTH} characters`);
      return;
    }

    const existingDrives = this.drives();
    const alreadyAdded = existingDrives.some(
      d => d.driveId.toUpperCase() === driveId.toUpperCase()
    );
    if (alreadyAdded) {
      this.setDriveIdError('Drive ID already added');
      return;
    }

    this.setDriveIdError('');
    this.isLoadingDrives.set(true);

    const chapterId = this.headerService.chapterId() || 'DAL';
    const filters: DriveInterfaceFilters = {
      chapterId,
      filterType: 'Specific',
      driveId: driveId.toUpperCase(),
      startDate: null,
      endDate: null
    };

    this.apiService.getDrives(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingDrives.set(false);
          if (response.success && response.data && response.data.length > 0) {
            const currentDrives = this.drives();
            const newDrive = response.data[0];
            newDrive.sequence = currentDrives.length + 1;
            this.drives.set([...currentDrives, newDrive]);
            this.suppressBlur = true;
            this.filterForm.patchValue({ driveId: '' });
            this.setDriveIdError('');
            setTimeout(() => {
              this.suppressBlur = false;
              this.driveIdInput?.nativeElement.focus();
            }, 100);
          } else {
            const errorCode = response.errorResponse?.errorCode || '';
            const errorMsg = response.errorResponse?.error || response.message || 'Invalid drive ID';
            this.setDriveIdError(errorCode ? `${errorCode}: ${errorMsg}` : errorMsg);
          }
        },
        error: (error) => {
          this.isLoadingDrives.set(false);
          const errorBody = error?.error;
          const errorCode = errorBody?.errorResponse?.errorCode || '';
          const errorMsg = errorBody?.errorResponse?.error || errorBody?.message || 'Invalid drive ID';
          this.setDriveIdError(errorCode ? `${errorCode}: ${errorMsg}` : errorMsg);
        }
      });
  }

  onStartDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    DateFieldValidationUtility.handleStartDateInput(inputValue, this.filterForm.get('startDate'));
  }

  onEndDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    DateFieldValidationUtility.handleStartDateInput(inputValue, this.filterForm.get('endDate'));
  }

  onDateChange(field: 'start' | 'end'): void {
    const startDate = this.filterForm.get('startDate')?.value;
    const endDate = this.filterForm.get('endDate')?.value;

    if (startDate && endDate) {
      this.filterForm.updateValueAndValidity();
      if (!this.filterForm.errors) {
        this.loadDrives();
      }
    }
  }

  getStartDateError(): string {
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.filterForm.get('startDate'), 'Start Date', 'End Date', this.filterForm.errors
    );
  }

  getEndDateError(): string {
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.filterForm.get('endDate'), 'End Date', 'Start Date', this.filterForm.errors
    );
  }

  onSortChange(event: TableSortEvent): void {
    this.currentSort.set({
      column: event.column,
      direction: event.direction as 'A' | 'D'
    });
    this.loadDrives();
  }

  loadDrives(): void {
    this.isLoadingDrives.set(true);
    const filters = this.getFilters();

    this.apiService.getDrives(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingDrives.set(false);
          if (response.success && response.data) {
            this.drives.set(response.data);
          } else {
            this.drives.set([]);
            const errorMessage = response.message || 'No drives found';
            this.snackBar.open(errorMessage, 'Close', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          }
        },
        error: (error) => {
          console.error('Error loading drives:', error);
          this.isLoadingDrives.set(false);
          this.drives.set([]);
          const errorBody = error?.error;
          const errorMessage = errorBody?.message || 'Failed to load drives';
          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        }
      });
  }


  onClearFilters(): void {
    this.filterForm.reset({
      filterType: '',
      driveId: '',
      startDate: null,
      endDate: null
    });
    this.showSearchField.set(false);
    this.showDateFields.set(false);
    this.drives.set([]);
    this.selectedDrives.set([]);
    this.driveIdError.set('');
    this.dateError.set('');
    this.transferStatus.set({ status: 'idle' });
  }

  onStartTransfer(): void {
    const allDrives = this.drives();

    if (allDrives.length === 0) {
      this.snackBar.open('No drives available to transfer', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      return;
    }

    const chapterId = this.headerService.chapterId() || 'DAL';
    const totalDrives = allDrives.length;
    this.transferErrors = [];

    const startTime = new Date();

    this.transferStatus.set({
      status: 'processing',
      processStartTime: startTime,
      currentDrive: 0,
      totalDrives: totalDrives,
      processDuration: '00:00:00'
    });

    this.startTimer(startTime);

    const BATCH_SIZE = 50;

    interface BatchInfo {
      driveIds: string[];
      size: number;
      index: number;
    }

    const batches: BatchInfo[] = [];
    for (let i = 0; i < allDrives.length; i += BATCH_SIZE) {
      const driveIds = allDrives.slice(i, i + BATCH_SIZE).map(d => d.driveId);
      batches.push({
        driveIds: driveIds,
        size: driveIds.length,
        index: batches.length
      });
    }

    let processedDrives = 0;

    from(batches)
      .pipe(
        concatMap((batch) => {
          this.transferStatus.update(status => ({
            ...status,
            currentDrive: Math.min(processedDrives + batch.size, totalDrives)
          }));

          return this.apiService.startTransfer(chapterId, batch.driveIds)
            .pipe(
              catchError((error) => {
                console.error(`Batch ${batch.index + 1} failed:`, error);
                const errorMessage = error?.error?.message || 'Batch transfer failed';

                batch.driveIds.forEach(driveId => {
                  this.transferErrors.push({
                    driveId: driveId,
                    error: errorMessage
                  });
                });

                return of({
                  success: false,
                  message: errorMessage,
                  batchSize: batch.size
                });
              }),
              concatMap((response: any) => of({
                ...response,
                batchSize: batch.size
              }))
            );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          processedDrives += response.batchSize;

          if (response.success) {
            console.log(`Batch completed successfully (${response.batchSize} drives)`);
          }

          if (totalDrives === 1 && response.success) {
            this.snackBar.open(
              `${allDrives[0].driveId} drive transferred to Lab System successfully.`,
              'DISMISS',
              {
                duration: 5000,
                horizontalPosition: 'end',
                verticalPosition: 'top'
              }
            );
          }
        },
        error: (error) => {
          console.error('Transfer process error:', error);
          this.stopTimer();
          const endTime = new Date();

          this.transferStatus.set({
            status: 'error',
            processStartTime: startTime,
            processEndTime: endTime,
            message: 'Transfer process failed'
          });

          this.snackBar.open('Transfer process failed', 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        },
        complete: () => {
          this.stopTimer();
          const endTime = new Date();

          const successCount = totalDrives - this.transferErrors.length;
          let message: string;

          if (totalDrives === 1) {
            const driveId = allDrives[0].driveId;
            message = this.transferErrors.length > 0
              ? `${driveId} drive failed to transfer to Lab System.`
              : `${driveId} drive transferred to Lab System successfully.`;
          } else {
            message = this.transferErrors.length > 0
              ? `${successCount} of ${totalDrives} drives transferred to Lab System successfully. ${this.transferErrors.length} drive(s) failed.`
              : `${totalDrives} drives transferred to Lab System successfully.`;
          }

          this.transferStatus.set({
            status: 'success',
            processStartTime: startTime,
            processEndTime: endTime,
            currentDrive: totalDrives,
            totalDrives: totalDrives,
            message: message,
            processDuration: this.calculateDuration(startTime, endTime)
          });

          if (totalDrives > 1 || this.transferErrors.length > 0) {
            this.snackBar.open(message, 'DISMISS', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          }

          if (this.transferErrors.length > 0) {
            const errorDetails = this.transferErrors.map(e => `${e.driveId}: ${e.error}`).join('\n');
            console.error('Transfer errors:', errorDetails);
          }

          setTimeout(() => {
            this.filterForm.reset({
              filterType: '',
              driveId: '',
              startDate: null,
              endDate: null
            });
            this.showSearchField.set(false);
            this.showDateFields.set(false);
            this.drives.set([]);
            this.selectedDrives.set([]);
            this.driveIdError.set('');
            this.dateError.set('');
            this.transferStatus.set({ status: 'idle' });

            setTimeout(() => this.filterTypeSelect?.focus(), 100);
          }, 2000);
        }
      });
  }

  private getFilters(): DriveInterfaceFilters {
    const formValue = this.filterForm.value;
    const chapterId = this.headerService.chapterId() || 'DAL';

    return {
      chapterId: chapterId,
      filterType: formValue.filterType || 'All',
      driveId: formValue.driveId ? formValue.driveId.toUpperCase() : '',
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      sortSequence: this.currentSort().direction
    };
  }


  formatDateTime(date: Date | undefined): string {
    if (!date) return '-';

    const chapterTimezone = this.headerService.getCurrentChapterTimezone() || 'UTC';

    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: chapterTimezone,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };

      const formatter = new Intl.DateTimeFormat('en-US', options);
      const parts = formatter.formatToParts(date);

      const day = parts.find(p => p.type === 'day')?.value || '';
      const month = (parts.find(p => p.type === 'month')?.value || '').toUpperCase();
      const year = parts.find(p => p.type === 'year')?.value || '';
      const hour = parts.find(p => p.type === 'hour')?.value || '';
      const minute = parts.find(p => p.type === 'minute')?.value || '';
      const second = parts.find(p => p.type === 'second')?.value || '';

      return `${day}-${month}-${year} ${hour}:${minute}:${second}`;
    } catch (error) {
      console.error('Error formatting date with timezone:', error);
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
      const year = date.getUTCFullYear();
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const seconds = String(date.getUTCSeconds()).padStart(2, '0');
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    }
  }

  formatTime(date: Date | undefined): string {
    if (!date) return '--:--';

    const chapterTimezone = this.headerService.getCurrentChapterTimezone() || 'UTC';

    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: chapterTimezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };

      const formatter = new Intl.DateTimeFormat('en-US', options);
      const parts = formatter.formatToParts(date);

      const hour = parts.find(p => p.type === 'hour')?.value || '';
      const minute = parts.find(p => p.type === 'minute')?.value || '';

      return `${hour}:${minute}`;
    } catch (error) {
      console.error('Error formatting time with timezone:', error);
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  }

  private startTimer(startTime: Date): void {
    this.stopTimer();

    this.timerSubscription = interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const duration = this.calculateDuration(startTime, new Date());
        this.transferStatus.update(status => ({
          ...status,
          processDuration: duration
        }));
      });
  }

  private stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
  }

  private calculateDuration(startTime: Date, endTime: Date): string {
    const durationMs = endTime.getTime() - startTime.getTime();
    const totalSeconds = Math.floor(durationMs / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}
