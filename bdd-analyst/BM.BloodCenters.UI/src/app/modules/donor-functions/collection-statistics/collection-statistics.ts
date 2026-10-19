import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { forkJoin, takeUntil } from 'rxjs';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { MatTabsModule } from '@angular/material/tabs';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';

import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { DateRangePairErrorStateMatcher } from '@shared/error-state-matchers/date-range-pair-error-state.matcher';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';

import { CollectionStatisticsService } from '@shared/services/collection-statistics.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  DailyStatisticsDto,
  DonationProcedureStatisticsDto,
  DonationTypeLookup,
  ProcedureCodeLookup,
  CollectionStatisticsResponse,
  VenipunctureStatDto,
  DeferralStatDto,
  UnitRowDto,
} from '@shared/models/collection-statistics.model';

interface OptionItem {
  value: string;
  label: string;
}

@Component({
  selector: 'app-collection-statistics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTabsModule,
    DataTable,
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
  templateUrl: './collection-statistics.html',
  styleUrls: ['./collection-statistics.scss'],
})
export class CollectionStatistics implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly snackbarService = inject(SnackbarService);
  private readonly service = inject(CollectionStatisticsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialogRef = inject(MatDialogRef<CollectionStatistics>);
  private readonly destroy$ = new Subject<void>();

  readonly OPTIONS: OptionItem[] = [
    { value: 'A', label: 'ALL' },
    { value: 'F', label: 'Fixed' },
    { value: 'M', label: 'Mobile' },
  ];

  // Table configs
  dailyTableConfig: DataTableConfig<DailyStatisticsDto> = {
    columns: [
      { key: 'collectionDate', header: 'Date', valueFormatter: (v) => this.formatDisplayDate(v) },
      { key: 'collectionDay', header: 'Day', valueFormatter: (v) => this.formatDay(v) },
      { key: 'actualDraw', header: 'Actual Draw' },
      { key: 'actualDeferral', header: 'Actual Deferral' },
    ],
    stickyHeader: true,
    showFooter: true,
    stickyFooter: true,
    footerData: {},
    showPagination: false,
    enableRowHighlight: true,
    emptyMessage: 'No data available',
  };

  donProcTableConfig: DataTableConfig<DonationProcedureStatisticsDto> = {
    columns: [
      { key: 'donationType', header: 'Donation Type' },
      { key: 'procedureCode', header: 'Procedure Code' },
      { key: 'donationProcedureCount', header: 'Count' },
    ],
    stickyHeader: true,
    showPagination: false,
    enableRowHighlight: false,
    showTableOnEmpty: true,
  };

  veniTableConfig: DataTableConfig<VenipunctureStatDto> = {
    columns: [
      { key: 'veniCode', header: 'Venipuncture Code' },
      { key: 'veniDesc', header: 'Description' },
      { key: 'veniCount', header: 'Count' },
    ],
    stickyHeader: true,
    showPagination: false,
    enableRowHighlight: false,
    showTableOnEmpty: true,
  };

  deferralTableConfig: DataTableConfig<DeferralStatDto> = {
    columns: [
      { key: 'interCode', header: 'Interdiction Code' },
      { key: 'originatedFrom', header: 'Deferral Code' },
      { key: 'defCount', header: 'Count' },
    ],
    stickyHeader: true,
    showPagination: false,
    enableRowHighlight: false,
    showTableOnEmpty: true,
  };

  unitsTableConfig: DataTableConfig<UnitRowDto> = {
    columns: [
      { key: 'displayUnitId', header: 'Unit ID' },
      { key: 'donationType', header: 'Donation Type' },
      { key: 'procedureCode', header: 'Procedure Code' },
      { key: 'attrib01', header: '01' },
      { key: 'attrib02', header: '02' },
      { key: 'attrib03', header: '03' },
      { key: 'attrib04', header: '04' },
      { key: 'attrib05', header: '05' },
      { key: 'attrib06', header: '06' },
      { key: 'attrib07', header: '07' },
      { key: 'attrib08', header: '08' },
    ],
    stickyHeader: true,
    showPagination: false,
    enableRowHighlight: false,
    emptyMessage: 'No unit data for the selected date',
  };

  filterForm!: FormGroup;
  donationTypes: DonationTypeLookup[] = [];
  procedureCodes: ProcedureCodeLookup[] = [];
  filteredDonationTypes: DonationTypeLookup[] = [];
  filteredProcedureCodes: ProcedureCodeLookup[] = [];
  readonly procCodeSearchControl = new FormControl('');
  readonly donTypeSearchControl = new FormControl('');

  // Report data
  dailyStatistics: DailyStatisticsDto[] = [];
  totalDraws = 0;
  totalDeferrals = 0;

  // Selected row + detail data
  selectedRow: DailyStatisticsDto | null = null;
  procedureStatistics: DonationProcedureStatisticsDto[] = [];
  venipunctureStatistics: VenipunctureStatDto[] = [];
  deferralStatistics: DeferralStatDto[] = [];
  totalProcedureCount = 0;
  totalVeniCount = 0;
  totalDeferralCount = 0;
  unitRows: UnitRowDto[] = [];

  dateRangeErrorMatcher!: DateRangePairErrorStateMatcher;
  private dateBlurTimer: ReturnType<typeof setTimeout> | null = null;

  // Loading flags
  isLoadingLovs = false;
  isLoadingData = false;
  isLoadingDetail = false;
  hasData = false;

  get selectedProcedureCodeDescription(): string {
    const codes: string[] = this.filterForm?.get('procedureCode')?.value || [];
    if (!codes.length) return '-';
    if (codes.length === 1) {
      return this.procedureCodes.find((p) => p.code === codes[0])?.description ?? '-';
    }
    return `${codes.length} selected`;
  }

  get selectedDonationTypeDescription(): string {
    const codes: string[] = this.filterForm?.get('donationType')?.value || [];
    if (!codes.length) return '-';
    if (codes.length === 1) {
      return this.donationTypes.find((d) => d.code === codes[0])?.description ?? '-';
    }
    return `${codes.length} selected`;
  }

  get isRetrieveDisabled(): boolean {
    return this.filterForm?.invalid || this.isLoadingData;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupSearchSubscriptions();
    this.loadLovs();
  }

  ngOnDestroy(): void {
    if (this.dateBlurTimer) clearTimeout(this.dateBlurTimer);
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onClear(): void {
    this.filterForm.reset({ option: 'A', fromDate: null, toDate: null, procedureCode: [], donationType: [] });
    this.filterForm.markAsUntouched();
    this.filterForm.markAsPristine();
    this.procCodeSearchControl.setValue('');
    this.donTypeSearchControl.setValue('');
    this.dailyStatistics = [];
    this.totalDraws = 0;
    this.totalDeferrals = 0;
    this.selectedRow = null;
    this.procedureStatistics = [];
    this.venipunctureStatistics = [];
    this.deferralStatistics = [];
    this.totalProcedureCount = 0;
    this.totalVeniCount = 0;
    this.totalDeferralCount = 0;
    this.unitRows = [];
    this.hasData = false;
    this.cdr.markForCheck();
  }

  onRetrieve(): void {
    this.filterForm.markAllAsTouched();
    if (this.filterForm.invalid || this.isLoadingData) {
      this.cdr.markForCheck();
      return;
    }

    const fv = this.filterForm.getRawValue();
    this.isLoadingData = true;
    this.selectedRow = null;
    this.procedureStatistics = [];
    this.venipunctureStatistics = [];
    this.deferralStatistics = [];
    this.unitRows = [];
    this.cdr.markForCheck();

    this.service
      .getReport({
        fromDate: this.formatDateForApi(fv.fromDate),
        toDate: this.formatDateForApi(fv.toDate),
        option: fv.option || 'A',
        donationTypes: fv.donationType?.length ? fv.donationType.join(',') : undefined,
        procedureCodes: fv.procedureCode?.length ? fv.procedureCode.join(',') : undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: CollectionStatisticsResponse) => {
          this.dailyStatistics = data.dailyStatistics || [];
          this.totalDraws = data.totalDraws ?? 0;
          this.totalDeferrals = data.totalDeferrals ?? 0;
          this.dailyTableConfig = {
            ...this.dailyTableConfig,
            footerData: {
              collectionDate: 'Total',
              collectionDay: '',
              actualDraw: this.totalDraws,
              actualDeferral: this.totalDeferrals,
            },
          };
          this.hasData = true;
          this.isLoadingData = false;
          // Auto-select first row and load its detail
          if (this.dailyStatistics.length > 0) {
            this.loadRowDetail(this.dailyStatistics[0]);
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.showError(this.getErrorMessage(error, 'Failed to retrieve collection statistics'));
          this.isLoadingData = false;
          this.cdr.markForCheck();
        },
      });
  }

  onDailyRowClick(row: DailyStatisticsDto): void {
    if (this.selectedRow?.collectionDate === row.collectionDate) return;
    this.loadRowDetail(row);
  }

  formatDisplayDate(iso: string): string {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      const day = d.getDate().toString().padStart(2, '0');
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
    } catch {
      return iso;
    }
  }

  formatDay(day: string): string {
    if (!day) return '';
    const map: Record<string, string> = {
      MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday',
      THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday',
    };
    return map[day?.toUpperCase()] ?? day;
  }

  onDateBlur(controlName: string, inputElement: HTMLInputElement): void {
    if (this.dateBlurTimer) clearTimeout(this.dateBlurTimer);
    this.dateBlurTimer = setTimeout(() => {
      const control = this.filterForm.get(controlName);
      const inputValue = inputElement.value?.trim();
      if (inputValue && control?.value === null) {
        control.setErrors({ invalidDateFormat: true });
        control.markAsTouched();
        this.cdr.markForCheck();
      }
    });
  }

  getFromDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.filterForm.get('fromDate'),
      this.filterForm.errors,
      'From Date',
    );
  }

  getToDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.filterForm.get('toDate'),
      this.filterForm.errors,
      'To Date',
      'To Date must be on or after From Date',
    );
  }

  private setupSearchSubscriptions(): void {
    this.procCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search || '').toLowerCase();
        if (!term) {
          this.filteredProcedureCodes = [...this.procedureCodes];
        } else {
          this.filteredProcedureCodes = this.procedureCodes.filter(
            (p) => p.code.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term),
          );
        }
        this.cdr.markForCheck();
      });

    this.donTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search || '').toLowerCase();
        if (!term) {
          this.filteredDonationTypes = [...this.donationTypes];
        } else {
          this.filteredDonationTypes = this.donationTypes.filter(
            (d) => d.code.toLowerCase().includes(term) || d.description?.toLowerCase().includes(term),
          );
        }
        this.cdr.markForCheck();
      });
  }

  private loadRowDetail(row: DailyStatisticsDto): void {
    this.selectedRow = row;
    this.isLoadingDetail = true;
    this.procedureStatistics = [];
    this.venipunctureStatistics = [];
    this.deferralStatistics = [];
    this.unitRows = [];
    this.cdr.markForCheck();

    const fv = this.filterForm.getRawValue();
    const collectionDate = row.collectionDate;
    const option = fv.option || 'A';
    const donationTypes = fv.donationType?.length ? fv.donationType.join(',') : undefined;
    const procedureCodes = fv.procedureCode?.length ? fv.procedureCode.join(',') : undefined;

    forkJoin({
      detail: this.service.getDateDetail({ collectionDate, option, donationTypes, procedureCodes }),
      units: this.service.getUnits({ collectionDate, option }),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ detail, units }) => {
          this.procedureStatistics = detail.procedureStatistics || [];
          this.venipunctureStatistics = detail.venipunctureStatistics || [];
          this.deferralStatistics = detail.deferralStatistics || [];
          this.totalProcedureCount = detail.totalProcedureCount ?? 0;
          this.totalVeniCount = detail.totalVeniCount ?? 0;
          this.totalDeferralCount = detail.totalDeferralCount ?? 0;
          this.unitRows = units;
          this.isLoadingDetail = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoadingDetail = false;
          this.cdr.markForCheck();
        },
      });
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group(
      {
        option: ['A', Validators.required],
        fromDate: [null, Validators.required],
        toDate: [null, Validators.required],
        procedureCode: [[]],
        donationType: [[]],
      },
      {
        validators: [DateFieldValidationUtility.fromToDateRangeValidator('fromDate', 'toDate')],
      },
    );

    this.dateRangeErrorMatcher = new DateRangePairErrorStateMatcher(() => this.filterForm);

    this.filterForm.get('fromDate')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((fromDate) => {
        const toDateCtrl = this.filterForm.get('toDate')!;
        if (fromDate && !toDateCtrl.value) {
          const toDate = fromDate.clone().add(6, 'days');
          toDateCtrl.setValue(toDate);
          toDateCtrl.markAsTouched();
        }
      });
  }

  private loadLovs(): void {
    this.isLoadingLovs = true;
    this.filterForm.get('procedureCode')?.disable({ emitEvent: false });
    this.filterForm.get('donationType')?.disable({ emitEvent: false });
    this.service
      .loadLovs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ donationTypes, procedureCodes }) => {
          this.donationTypes = donationTypes;
          this.procedureCodes = procedureCodes;
          this.filteredDonationTypes = [...donationTypes];
          this.filteredProcedureCodes = [...procedureCodes];
          this.isLoadingLovs = false;
          this.filterForm.get('procedureCode')?.enable({ emitEvent: false });
          this.filterForm.get('donationType')?.enable({ emitEvent: false });
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoadingLovs = false;
          this.filterForm.get('procedureCode')?.enable({ emitEvent: false });
          this.filterForm.get('donationType')?.enable({ emitEvent: false });
          this.cdr.markForCheck();
        },
      });
  }

  private formatDateForApi(date: unknown): string {
    if (!date) return '';
    try {
      const d = (date as { toDate?: () => Date }).toDate
        ? (date as { toDate: () => Date }).toDate()
        : new Date(date as string);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}T00:00:00`;
    } catch {
      return '';
    }
  }

  private getErrorMessage(
    error: { error?: { errorResponse?: { error?: string }; message?: string }; message?: string },
    fallback: string,
  ): string {
    return error?.error?.errorResponse?.error || error?.error?.message || error?.message || fallback;
  }

  private showError(message: string): void {
    this.snackbarService.showError(message);
  }
}
