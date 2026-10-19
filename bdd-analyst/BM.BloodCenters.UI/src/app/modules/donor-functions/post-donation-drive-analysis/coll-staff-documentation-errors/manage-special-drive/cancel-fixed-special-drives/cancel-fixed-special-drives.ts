import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, finalize } from 'rxjs';

import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableColumn, PaginationConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';

import { CancelDriveService } from '../services/cancel-drive.service';
import {
  DriveForCancellationDto,
  DriveCancellationDetailsDto,
  DriveLookupDto,
  CancelReasonCodeDto,
  SearchDrivesQueryDto,
} from '../models/cancel-drive.model';

@Component({
  selector: 'app-cancel-fixed-special-drives',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './cancel-fixed-special-drives.html',
  styleUrls: ['./cancel-fixed-special-drives.scss'],
})
export class CancelFixedSpecialDrivesComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly cancelDriveService = inject(CancelDriveService);
  private readonly headerService = inject(HeaderService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Donor Functions', link: null },
      { label: 'Cancel Fixed & Special Drives', link: null },
    ],
    title: 'Cancel Fixed & Special Drives',
    subtitle: 'Search and cancel confirmed or held drives',
    actions: [],
  };

  searchForm!: FormGroup;
  cancelForm!: FormGroup;

  // Drive ID LOV search
  driveIdSearchCtrl = new FormControl('');
  drivesLookup = signal<DriveLookupDto[]>([]);
  filteredDrivesLookup = signal<DriveLookupDto[]>([]);

  // Cancel reason code dropdown
  cancelCodeSearchCtrl = new FormControl('');
  cancelReasonCodes = signal<CancelReasonCodeDto[]>([]);
  filteredCancelReasonCodes = signal<CancelReasonCodeDto[]>([]);
  selectedCodeDescription = signal('');

  // Table state
  drives = signal<DriveForCancellationDto[]>([]);
  totalDrives = signal(0);
  isSearching = signal(false);
  pageIndex = 0;
  pageSize = 25;
  sortOrder: 'ASC' | 'DESC' = 'ASC';
  hasSearched = signal(false);
  tableConfig!: DataTableConfig<DriveForCancellationDto>;

  // Selected drive
  selectedDrive = signal<DriveCancellationDetailsDto | null>(null);
  isLoadingDetails = signal(false);
  isCancelling = signal(false);

  currentChapterId = '';

  ngOnInit(): void {
    this.currentChapterId = this.headerService.chapterId();
    this.initForms();
    this.buildTableConfig();
    this.loadLookupData();
    this.setupSearchSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    this.searchForm = this.fb.group({
      driveId: [''],
      driveDate: [null],
      sponsorName: [''],
      locationId: [''],
    });

    this.cancelForm = this.fb.group({
      cancelReasonCode: ['', Validators.required],
      cancelReason: ['', [Validators.required, Validators.maxLength(100)]],
    });

    this.cancelForm.get('cancelReasonCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(code => {
        const found = this.cancelReasonCodes().find(r => r.code === code);
        this.selectedCodeDescription.set(found?.description ?? '');
      });
  }

  private loadLookupData(): void {
    this.cancelDriveService.getCancelReasonCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: codes => {
          this.cancelReasonCodes.set(codes);
          this.filteredCancelReasonCodes.set(codes);
        },
        error: () => {
          this.snackBar.open('Failed to load cancel reason codes', 'DISMISS', {
            horizontalPosition: 'end', verticalPosition: 'top',
          });
        },
      });

    this.cancelDriveService.getDrivesLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: drives => {
          this.drivesLookup.set(drives);
          this.filteredDrivesLookup.set(drives);
        },
        error: (err) => {
          console.error('Failed to load drives lookup:', err);
          this.snackBar.open('Failed to load Drive ID list', 'DISMISS', {
            horizontalPosition: 'end', verticalPosition: 'top',
          });
        },
      });
  }

  private setupSearchSubscriptions(): void {
    this.driveIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const s = (search || '').toLowerCase();
        this.filteredDrivesLookup.set(
          s
            ? this.drivesLookup().filter(d => d.driveId.toLowerCase().includes(s))
            : this.drivesLookup()
        );
      });

    this.cancelCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const s = (search || '').toLowerCase();
        this.filteredCancelReasonCodes.set(
          s
            ? this.cancelReasonCodes().filter(c =>
                c.code.toLowerCase().includes(s) || c.description.toLowerCase().includes(s)
              )
            : this.cancelReasonCodes()
        );
      });
  }

  private buildTableConfig(): void {
    const columns: TableColumn<DriveForCancellationDto>[] = [
      { key: 'driveId', header: 'Drive ID', sortable: true, width: '140px' },
      {
        key: 'driveDate',
        header: 'Drive Date',
        sortable: true,
        width: '130px',
        valueFormatter: (v) => this.formatDate(v),
      },
      { key: 'sponsorName', header: 'Sponsor Name', sortable: true },
      { key: 'locationName', header: 'Location', sortable: true },
      {
        key: 'status',
        header: 'Status',
        sortable: false,
        width: '110px',
        valueFormatter: (v) => this.formatStatus(v),
      },
    ];

    const pagination: PaginationConfig = {
      pageSize: this.pageSize,
      pageIndex: this.pageIndex,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    };

    this.tableConfig = {
      columns,
      pagination,
      sortConfig: { column: 'driveDate', direction: 'A' },
      stickyHeader: true,
      emptyMessage: 'No drives found',
      emptySubMessage: 'Adjust your search criteria and try again',
      noDataIcon: 'directions_car',
      enableRowHighlight: true,
      showPagination: true,
    };
  }

  onSearch(): void {
    this.pageIndex = 0;
    this.selectedDrive.set(null);
    this.cancelForm.reset();
    this.selectedCodeDescription.set('');
    this.executSearch();
  }

  private executSearch(): void {
    const formValue = this.searchForm.value;
    const query: SearchDrivesQueryDto = {
      driveId: formValue.driveId || undefined,
      driveDate: formValue.driveDate
        ? this.formatDateForApi(formValue.driveDate)
        : undefined,
      sponsorName: formValue.sponsorName || undefined,
      locationId: formValue.locationId || undefined,
      sortOrder: this.sortOrder,
      take: this.pageSize,
      skip: this.pageIndex * this.pageSize,
    };

    this.isSearching.set(true);
    this.hasSearched.set(true);

    this.cancelDriveService.searchDrives(query)
      .pipe(takeUntil(this.destroy$), finalize(() => this.isSearching.set(false)))
      .subscribe({
        next: ({ data, total }) => {
          this.drives.set(data);
          this.totalDrives.set(total);
        },
        error: () => {
          this.snackBar.open('Error searching drives. Please try again.', 'DISMISS', {
            horizontalPosition: 'end', verticalPosition: 'top',
          });
          this.drives.set([]);
          this.totalDrives.set(0);
        },
      });
  }

  onClearSearch(): void {
    this.searchForm.reset();
    this.drives.set([]);
    this.totalDrives.set(0);
    this.selectedDrive.set(null);
    this.cancelForm.reset();
    this.selectedCodeDescription.set('');
    this.hasSearched.set(false);
  }

  onRowClick(drive: DriveForCancellationDto): void {
    if (this.selectedDrive()?.driveId === drive.driveId) return;
    this.cancelForm.reset();
    this.selectedCodeDescription.set('');
    this.loadDriveDetails(drive.driveId);
  }

  private loadDriveDetails(driveId: string): void {
    this.isLoadingDetails.set(true);
    this.selectedDrive.set(null);

    this.cancelDriveService.getDriveDetails(driveId)
      .pipe(takeUntil(this.destroy$), finalize(() => this.isLoadingDetails.set(false)))
      .subscribe({
        next: details => {
          this.selectedDrive.set(details);
          if (details.hasPiggybackGroups) {
            this.snackBar.open(
              'This drive has piggyback groups and cannot be cancelled.',
              'DISMISS',
              { horizontalPosition: 'end', verticalPosition: 'top' }
            );
          }
        },
        error: () => {
          this.snackBar.open('Error loading drive details. Please try again.', 'DISMISS', {
            horizontalPosition: 'end', verticalPosition: 'top',
          });
        },
      });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.executSearch();
  }

  onSortChange(event: TableSortEvent): void {
    this.sortOrder = event.direction === 'D' ? 'DESC' : 'ASC';
    this.pageIndex = 0;
    this.executSearch();
  }

  onCancelDrive(): void {
    if (this.cancelForm.invalid || !this.selectedDrive()) return;

    const { cancelReasonCode, cancelReason } = this.cancelForm.value;
    const driveId = this.selectedDrive()!.driveId;

    this.isCancelling.set(true);
    this.cancelDriveService
      .cancelDrive(driveId, {
        cancelReasonCode,
        cancelReason,
        confirmCancellation: true,
      })
      .pipe(takeUntil(this.destroy$), finalize(() => this.isCancelling.set(false)))
      .subscribe({
        next: result => {
          let msg = `Drive ${result.driveId} cancelled successfully.`;
          if (result.alertCreated) {
            msg += ' A last-minute cancellation alert was generated.';
          }
          this.snackBar.open(msg, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            duration: 6000,
          });
          this.selectedDrive.set(null);
          this.cancelForm.reset();
          this.selectedCodeDescription.set('');
          this.executSearch();
        },
        error: (err) => {
          const msg =
            err?.error?.message || err?.message || 'Error cancelling drive. Please try again.';
          this.snackBar.open(msg, 'DISMISS', {
            horizontalPosition: 'end', verticalPosition: 'top',
          });
        },
      });
  }

  get canCancelDrive(): boolean {
    const d = this.selectedDrive();
    return !!d && d.canBeCancelled && !d.hasPiggybackGroups && this.cancelForm.valid;
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    return `${day}-${month}-${date.getFullYear()}`;
  }

  formatTime(value: string | null | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  formatStatus(status: string): string {
    const map: Record<string, string> = {
      CNFRM: 'Confirmed',
      HOLD: 'Hold',
      CANCL: 'Cancelled',
    };
    return map[status] ?? status;
  }

  private formatDateForApi(date: Date | string): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
