import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { UnitIdFieldComponent, UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';

import { SeparationTimesOfflineApiService } from './services/separation-times-offline-api.service';
import {
  CentrifugeDto,
  SeparationTimesEntry,
  ValidateUnitResponseDto,
  SeparationTimesOfflineDto,
} from './models/separation-times-offline.model';

@Component({
  selector: 'app-separation-times-offline',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
  ],
  providers: [
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
  ],
  templateUrl: './separation-times-offline.html',
  styleUrls: ['./separation-times-offline.scss'],
})
export class SeparationTimesOfflineComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `separation-times-offline-${SeparationTimesOfflineComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly apiService = inject(SeparationTimesOfflineApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snackbarService = inject(SnackbarService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  private entrySavedSnackBarRef: MatSnackBarRef<TextOnlySnackBar> | null = null;

  @ViewChild(UnitIdFieldComponent) unitIdField?: UnitIdFieldComponent;
  @ViewChild('timeInput') timeInput?: ElementRef<HTMLInputElement>;

  private readonly defaultTitle = 'Separation Times Offline';

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: this.defaultTitle, link: null },
    ],
    title: this.defaultTitle,
    subtitle: '',
    actions: [],
  };

  filterForm!: FormGroup;

  centrifuges = signal<CentrifugeDto[]>([]);
  entries = signal<SeparationTimesEntry[]>([]);
  currentUnitData = signal<ValidateUnitResponseDto | null>(null);
  isProcessing = signal(false);
  isLoadingCentrifuges = signal(false);
  error = signal<string | null>(null);
  processDateError = signal<string | null>(null);

  showEntryFields = computed(() => !!this.currentUnitData());
  collectionDate = computed(() => {
    const data = this.currentUnitData();
    return data?.collDate ? this.formatDate(data.collDate) : '-';
  });
  firstSeparationTime = computed(() => {
    const data = this.currentUnitData();
    if (data?.firstSepDuration) return data.firstSepDuration;
    if (data?.firstSepTime) return this.formatDateTime(data.firstSepTime);
    return '-';
  });
  secondSeparationTime = computed(() => {
    const data = this.currentUnitData();
    if (data?.secondSepDuration) return data.secondSepDuration;
    if (data?.secondSepTime) return this.formatDateTime(data.secondSepTime);
    return '-';
  });
  canRecordFirst = computed(() => this.currentUnitData()?.canRecordFirst || false);
  canRecordSecond = computed(() => this.currentUnitData()?.canRecordSecond || false);
  entriesCount = computed(() => this.entries().length);

  private recordingCentrifugeSearch = signal('');
  filteredRecordingCentrifuges = computed(() => {
    const search = this.recordingCentrifugeSearch().toLowerCase();
    const all = this.centrifuges();
    if (!search) return all;
    return all.filter(
      (c) =>
        c.centrifugeId.toLowerCase().includes(search) ||
        (c.manufacturer && c.manufacturer.toLowerCase().includes(search))
    );
  });

  private sortColumn = signal('');
  private sortDirection = signal<'A' | 'D' | 'default'>('default');

  displayData = computed(() => {
    const data = [...this.entries()];
    const col = this.sortColumn();
    const dir = this.sortDirection();

    if (col && dir !== 'default') {
      data.sort((a, b) => {
        const aVal = (a as any)[col] ?? '';
        const bVal = (b as any)[col] ?? '';
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return dir === 'A' ? cmp : -cmp;
      });
    }

    return data;
  });

  dataTableConfig: DataTableConfig<SeparationTimesEntry> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: true, width: '18%' },
      { key: 'collectionDate', header: 'Collection Date', sortable: false, width: '16%' },
      { key: 'processDate', header: 'Process Date', sortable: false, width: '18%' },
      { key: 'centrifugeId', header: 'Centrifuge ID', sortable: false, width: '14%' },
      { key: 'firstSeparationTime', header: 'First Separation Time', sortable: false, width: '17%' },
      { key: 'secondSeparationTime', header: 'Second Separation Time', sortable: false, width: '17%' },
    ],
    pagination: {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    stickyHeader: true,
    showPagination: true,
    enableSelection: false,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Scan or enter a Unit ID to begin.',
    loadingMessage: 'Processing...',
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title || this.defaultTitle, link: null },
          ],
          title: pageData.title || this.defaultTitle,
          subtitle: pageData.subtitle || '',
        };
      }
    });

    effect(() => {
      const count = this.entries().length;
      if (this.dataTableConfig.pagination) {
        this.dataTableConfig.pagination.totalRecords = count;
      }
      const unitIdCol = this.dataTableConfig.columns.find((c) => c.key === 'unitId');
      if (unitIdCol) {
        unitIdCol.header = count > 0 ? `Unit ID (${count})` : 'Unit ID';
      }
    });

  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadCentrifuges();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.dismissEntrySavedSnackbar();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      processDate: [null],
      time: [''],
      recordingCentrifugeId: ['', Validators.required],
    });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.clearAll();
      this.loadCentrifuges();
    });
  }

  private loadCentrifuges(): void {
    this.isLoadingCentrifuges.set(true);
    this.apiService
      .getCentrifuges()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (centrifuges) => {
          this.centrifuges.set(centrifuges);
          this.isLoadingCentrifuges.set(false);
        },
        error: (error) => {
          console.error('Error loading centrifuges:', error);
          this.snackbarService.showError(this.formatApiError(error, 'Failed to load centrifuges. Please try again.'));
          this.isLoadingCentrifuges.set(false);
        },
      });
  }

  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const parsedUnitId = event.data.parsedUnitId;

    this.apiService.validateUnit(parsedUnitId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        if (!result.canRecordFirst && !result.canRecordSecond) {
          event.reject('No more separation times can be entered for this unit');
          return;
        }

        this.currentUnitData.set(result);
        event.confirm();
      },
      error: (error) => {
        event.reject(this.formatApiError(error, 'Failed to validate unit'));
      },
    });
  }

  onUnitValidated(data: UnitValidationResponse): void {
    const chapterNow = this.getChapterNow();
    const chapterDateOnly = moment(chapterNow.format('YYYY-MM-DD'), 'YYYY-MM-DD');
    this.filterForm.get('processDate')?.setValue(chapterDateOnly.toDate());
    this.filterForm.get('time')?.setValue(chapterNow.format('HH:mm'));

    setTimeout(() => this.timeInput?.nativeElement.focus(), 100);
  }

  private getChapterNow(): moment.Moment {
    const tzOffset = this.headerService.chapterTimeZone();
    return tzOffset ? moment().utcOffset(tzOffset) : moment();
  }

  onUnitCleared(): void {
    this.filterForm.get('processDate')?.setValue(null);
    this.filterForm.get('time')?.setValue('');
    this.currentUnitData.set(null);
    this.processDateError.set(null);
  }

  onTimeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cursorPos = input.selectionStart;
    const rawValue = input.value;
    let digits = rawValue.replace(/[^0-9]/g, '');

    if (digits.length > 4) {
      digits = digits.substring(0, 4);
    }

    const formatted = digits.length >= 3
      ? digits.substring(0, 2) + ':' + digits.substring(2)
      : digits;

    input.value = formatted;
    this.filterForm.get('time')?.setValue(formatted, { emitEvent: false });

    if (cursorPos !== null) {
      const digitsBeforeCursor = rawValue.substring(0, cursorPos).replace(/[^0-9]/g, '').length;
      const newPos = digitsBeforeCursor > 2 ? digitsBeforeCursor + 1 : digitsBeforeCursor;
      input.setSelectionRange(newPos, newPos);
    }
  }

  onTimeBlur(): void {
    const ctrl = this.filterForm.get('time');
    const value = ctrl?.value?.trim();
    if (!value) return;

    const digits = value.replace(/[^0-9]/g, '');
    let formatted = value;

    if (digits.length === 1) {
      formatted = digits.padStart(2, '0') + ':00';
    } else if (digits.length === 2) {
      formatted = digits + ':00';
    } else if (digits.length === 3) {
      formatted = digits.substring(0, 2) + ':' + digits.substring(2) + '0';
    } else if (digits.length === 4) {
      formatted = digits.substring(0, 2) + ':' + digits.substring(2);
    }

    const parts = formatted.split(':');
    if (parts.length === 2) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        ctrl?.setErrors({ invalidTime: true });
        return;
      }
    }

    ctrl?.setValue(formatted, { emitEvent: false });
    if (this.timeInput) this.timeInput.nativeElement.value = formatted;
  }

  onProcessDateChange(): void {
    const control = this.filterForm.get('processDate');
    if (!control?.value) return;

    const selectedDateStr = moment(control.value).format('YYYY-MM-DD');
    const chapterNow = this.getChapterNow();
    const chapterDateStr = chapterNow.format('YYYY-MM-DD');

    if (selectedDateStr > chapterDateStr) {
      this.processDateError.set('Process date cannot be in the future');
      return;
    }

    const collDate = this.currentUnitData()?.collDate;
    if (collDate) {
      const collDateStr = moment(collDate).format('YYYY-MM-DD');
      if (selectedDateStr < collDateStr) {
        this.processDateError.set('Process date cannot be before the collection date');
        return;
      }
    }

    this.processDateError.set(null);
  }

  onRecordingCentrifugeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const upper = input.value?.toUpperCase() || '';
    const cursorPos = input.selectionStart;
    input.value = upper;
    this.filterForm.get('recordingCentrifugeId')?.setValue(upper, { emitEvent: false });
    if (cursorPos !== null) {
      input.setSelectionRange(cursorPos, cursorPos);
    }
    this.recordingCentrifugeSearch.set(upper);
  }

  onRecordingCentrifugeSelected(event: MatAutocompleteSelectedEvent): void {
    const centrifugeId = event.option.value;
    this.filterForm.get('recordingCentrifugeId')?.setValue(centrifugeId, { emitEvent: false });
    this.filterForm.get('recordingCentrifugeId')?.setErrors(null);
    this.recordingCentrifugeSearch.set('');
    this.tryAutoSave();
  }

  onRecordingCentrifugeBlur(): void {
    setTimeout(() => {
      const ctrl = this.filterForm.get('recordingCentrifugeId');
      if (!ctrl?.errors) {
        const value = ctrl?.value?.toUpperCase()?.trim();
        if (value) {
          const match = this.centrifuges().find((c) => c.centrifugeId.toUpperCase() === value);
          if (match) {
            ctrl?.setValue(match.centrifugeId, { emitEvent: false });
            this.tryAutoSave();
          } else {
            ctrl?.setErrors({ invalidCentrifuge: true });
          }
        }
      }
      this.recordingCentrifugeSearch.set('');
    }, 200);
  }

  private tryAutoSave(): void {
    if (!this.currentUnitData()) return;
    const processDateValue = this.filterForm.get('processDate')?.value;
    const timeValue = this.filterForm.get('time')?.value?.trim();
    const centrifugeId = this.filterForm.get('recordingCentrifugeId')?.value;
    if (processDateValue && timeValue && centrifugeId) {
      this.onRecordSeparation();
    }
  }

  onRecordSeparation(): void {
    if (this.isProcessing()) return;

    const unitData = this.currentUnitData();
    if (!unitData || !this.unitIdField?.isValid) return;

    const unitId = this.unitIdField.parsedUnitId;
    const processDateValue = this.filterForm.get('processDate')?.value;
    const timeValue = this.filterForm.get('time')?.value?.trim();
    const centrifugeId = this.filterForm.get('recordingCentrifugeId')?.value;

    if (!unitId || !processDateValue || !timeValue || !centrifugeId) {
      this.snackbarService.showError('Please fill in all required fields');
      return;
    }

    const centrifugeValid = this.centrifuges().some((c) => c.centrifugeId.toUpperCase() === centrifugeId.toUpperCase());
    if (!centrifugeValid) {
      this.filterForm.get('recordingCentrifugeId')?.setErrors({ invalidCentrifuge: true });
      return;
    }

    const timeParts = timeValue.split(':');
    if (timeParts.length !== 2) {
      this.filterForm.get('time')?.setErrors({ invalidTime: true });
      return;
    }
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      this.filterForm.get('time')?.setErrors({ invalidTime: true });
      return;
    }

    const dateStr = moment(processDateValue).format('YYYY-MM-DD');
    const processDateStr = `${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

    const chapterNow = this.getChapterNow();
    const processDateChapter = moment(processDateStr, 'YYYY-MM-DDTHH:mm:ss');
    if (chapterNow && processDateChapter.isAfter(moment(chapterNow.format('YYYY-MM-DDTHH:mm:ss'), 'YYYY-MM-DDTHH:mm:ss'))) {
      this.snackbarService.showError('Process date cannot be in the future');
      return;
    }

    this.isProcessing.set(true);

    const request = {
      unitId,
      processDate: processDateStr,
      centrifugeId,
    };

    const apiCall = unitData.canRecordFirst
      ? this.apiService.recordFirstSeparation(request)
      : this.apiService.recordSecondSeparation(request);

    apiCall.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.isProcessing.set(false);

        const entry: SeparationTimesEntry = {
          unitId: response.unitId,
          collectionDate: this.formatDate(response.collDate),
          processDate: moment(processDateStr, 'YYYY-MM-DDTHH:mm:ss').format('DD-MMM-YYYY HH:mm').toUpperCase(),
          centrifugeId: centrifugeId,
          firstSeparationTime: response.firstSepDuration || (response.firstSepTime ? this.formatDateTime(response.firstSepTime) : '-'),
          secondSeparationTime: response.secondSepDuration || (response.secondSepTime ? this.formatDateTime(response.secondSepTime) : '-'),
        };

        this.entries.update((entries) => [...entries, entry]);
        this.showEntrySavedSnackbar();

        this.resetEntryFields();
      },
      error: (error) => {
        this.isProcessing.set(false);
        this.snackbarService.showError(this.formatApiError(error, 'Failed to record separation time. Please try again.'));
      },
    });
  }

  private resetEntryFields(): void {
    this.filterForm.get('processDate')?.setValue(null);
    this.filterForm.get('time')?.setValue('');
    const centrifugeCtrl = this.filterForm.get('recordingCentrifugeId');
    centrifugeCtrl?.setValue('');
    centrifugeCtrl?.setErrors(null);
    centrifugeCtrl?.markAsPristine();
    centrifugeCtrl?.markAsUntouched();
    this.recordingCentrifugeSearch.set('');
    this.currentUnitData.set(null);
    this.unitIdField?.clear();
    setTimeout(() => this.unitIdField?.focus(), 100);
  }

  onPageChange(event: TablePageEvent): void {
    if (this.dataTableConfig.pagination) {
      this.dataTableConfig.pagination.pageIndex = event.pageIndex;
      this.dataTableConfig.pagination.pageSize = event.pageSize;
    }
  }

  onSortChange(event: TableSortEvent): void {
    this.dataTableConfig.sortConfig = { column: event.column, direction: event.direction };
    this.sortColumn.set(event.direction === 'default' ? '' : event.column);
    this.sortDirection.set(event.direction);
  }

  clearAll(): void {
    this.filterForm.reset();
    this.entries.set([]);
    this.currentUnitData.set(null);
    this.error.set(null);
    this.processDateError.set(null);
    this.unitIdField?.clear();
    this.dismissEntrySavedSnackbar();
  }

  private showEntrySavedSnackbar(): void {
    this.dismissEntrySavedSnackbar();

    const count = this.entries().length;
    const message = count === 1 ? '1 Entry saved' : `${count} Entries saved`;

    this.entrySavedSnackBarRef = this.snackBar.open(message, 'DISMISS', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      duration: 0,
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

  private formatDate(value: string): string {
    if (!value) return '-';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  private formatDateTime(value: string): string {
    if (!value) return '-';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : value;
  }

  private formatApiError(error: any, fallback: string): string {
    const body = error?.error;
    const errorCode = body?.errorCode || body?.errorResponse?.errorCode;
    const errorMessage = body?.error || body?.errorResponse?.error || body?.message || error?.message || fallback;
    return errorCode ? `Error ${errorCode}: ${errorMessage}` : errorMessage;
  }

  get f() {
    return this.filterForm.controls;
  }
}
