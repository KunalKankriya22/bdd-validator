import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { UppercaseMomentDateAdapter, DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';
import { DriveSheetPrintStatusService } from './services/drive-sheet-print-status.service';
import { FilterDriveSheetPrintStatusComponent } from './filter-drive-sheet-print-status/filter-drive-sheet-print-status';
import {
  DriveSheetPrintStatusModel,
  DriveSheetPrintStatusRequest,
  DriveSheetPrintStatusFilter,
  FilterChip,
  DRIVE_TYPE_OPTIONS,
  STATUS_OPTIONS
} from './models/drive-sheet-print-status.model';

@Component({
  selector: 'app-drive-sheet-print-status',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMomentDateModule,
    MatTooltipModule,
    MatDialogModule,
    SlicePipe,
    PageHeaderWithBreadcrumb
  ],
  providers: [
    DatePipe,
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './drive-sheet-print-status.html',
  styleUrls: ['./drive-sheet-print-status.scss']
})
export class DriveSheetPrintStatusComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly driveService = inject(DriveSheetPrintStatusService);
  private readonly headerService = inject(HeaderService);
  private readonly datePipe = inject(DatePipe);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Drive Sheet Print Status', link: null }
    ],
    title: 'Drive Sheet Print Status',
    subtitle: 'Check whether drive sheets have been printed and track their print status for drives within a selected date range.',
    actions: []
  };

  // Form
  filterForm!: FormGroup;

  // Options
  driveTypeOptions = DRIVE_TYPE_OPTIONS;

  // State
  isLoading = signal(false);
  hasSearched = signal(false);

  // Data
  dataSource = signal<DriveSheetPrintStatusModel[]>([]);

  // Sort state (only Drive ID is sortable)
  sortColumn = signal<string>('driveId');
  sortDirection = signal<'asc' | 'desc' | 'default'>('default');

  // Filter state (using signals for reactivity)
  searchTerm = signal<string>('');
  currentFilters = signal<DriveSheetPrintStatusFilter>({});
  activeFilterChips: FilterChip[] = [];
  isFilterPanelOpen = false;

  // Computed
  hasResults = computed(() => this.filteredData().length > 0);

  // Apply client-side filtering for search and table filters
  filteredData = computed(() => {
    let data = [...this.dataSource()];
    const search = this.searchTerm();
    const filters = this.currentFilters();

    // Apply search filter (sponsor name)
    if (search.trim()) {
      const term = search.toLowerCase().trim();
      data = data.filter(item =>
        item.sponsorName?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (filters.status) {
      data = data.filter(item =>
        item.status?.toLowerCase() === filters.status?.toLowerCase()
      );
    }

    // Apply drive date filter
    if (filters.driveDate) {
      const filterDate = new Date(filters.driveDate);
      filterDate.setHours(0, 0, 0, 0);
      data = data.filter(item => {
        if (!item.driveDate) return false;
        const driveDate = new Date(item.driveDate);
        driveDate.setHours(0, 0, 0, 0);
        return driveDate.getTime() === filterDate.getTime();
      });
    }

    return data;
  });

  sortedData = computed(() => {
    const data = [...this.filteredData()];
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (direction === 'default' || column !== 'driveId') {
      return data;
    }

    return data.sort((a, b) => {
      const aVal = a.driveId;
      const bVal = b.driveId;

      return direction === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });
  });

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

    this.filterForm = this.fb.group({
      fromDate: [firstDayOfYear, Validators.required],
      toDate: [today, Validators.required],
      driveType: ['DNP', Validators.required]
    });
  }

  retrieve(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }

    // Validate from date is not greater than to date
    const fromDate = this.filterForm.value.fromDate;
    const toDate = this.filterForm.value.toDate;

    if (fromDate > toDate) {
      // This will be handled by form validation
      return;
    }

    this.isLoading.set(true);
    this.hasSearched.set(true);
    this.sortDirection.set('default');

    const request: DriveSheetPrintStatusRequest = {
      fromDate: this.formatDateForApi(fromDate),
      toDate: this.formatDateForApi(toDate),
      driveType: this.filterForm.value.driveType,
      chapterId: this.headerService.getCurrentChapterId()
    };

    this.driveService.searchDrives(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response?.data) {
            this.dataSource.set(response.data);
          } else {
            this.dataSource.set([]);
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.dataSource.set([]);
          this.isLoading.set(false);
        }
      });
  }

  private formatDateForApi(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  formatDate(date: string | Date | null): string {
    if (!date) return '-';
    return this.datePipe.transform(date, 'dd-MMM-yyyy')?.toUpperCase() || '-';
  }

  formatDateTime(date: string | Date | null): string {
    if (!date) return '-';
    return this.datePipe.transform(date, 'dd-MMM-yyyy')?.toUpperCase() || '-';
  }

  toggleSort(column: string): void {
    if (column !== 'driveId') return;

    if (this.sortColumn() === column) {
      const current = this.sortDirection();
      if (current === 'default') {
        this.sortDirection.set('asc');
      } else if (current === 'asc') {
        this.sortDirection.set('desc');
      } else {
        this.sortDirection.set('default');
      }
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(column: string): string {
    if (column !== 'driveId') return '';

    if (this.sortColumn() === column && this.sortDirection() !== 'default') {
      switch (this.sortDirection()) {
        case 'asc':
          return 'arrow_upward';
        case 'desc':
          return 'arrow_downward';
        default:
          return 'unfold_more';
      }
    }
    return 'unfold_more';
  }

  getSortAriaLabel(column: string): string {
    if (column !== 'driveId') return '';

    if (this.sortColumn() !== column) {
      return 'Sort by Drive ID';
    }

    switch (this.sortDirection()) {
      case 'asc': return 'Drive ID sorted ascending, click to sort descending';
      case 'desc': return 'Drive ID sorted descending, click to remove sort';
      default: return 'Sort by Drive ID';
    }
  }

  trackByDriveId(index: number, row: DriveSheetPrintStatusModel): string {
    return row.driveId;
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  openFilter(event: MouseEvent): void {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const dialogWidth = 360;
    const spacing = 8;
    const left = Math.min(rect.left, window.innerWidth - dialogWidth - spacing);

    this.isFilterPanelOpen = true;

    const dialogRef = this.dialog.open(FilterDriveSheetPrintStatusComponent, {
      width: `${dialogWidth}px`,
      maxWidth: '90vw',
      panelClass: 'filter-dialog',
      backdropClass: 'transparent-backdrop',
      hasBackdrop: true,
      data: this.currentFilters(),
      position: {
        top: `${rect.bottom + spacing}px`,
        left: `${left}px`,
      },
    });

    dialogRef.afterClosed().subscribe((filters: DriveSheetPrintStatusFilter) => {
      this.isFilterPanelOpen = false;
      if (filters) {
        this.currentFilters.set(filters);
        this.buildFilterChips();
      }
    });
  }

  buildFilterChips(): void {
    const chips: FilterChip[] = [];
    const filters = this.currentFilters();

    if (filters.status) {
      const statusOption = STATUS_OPTIONS.find(opt => opt.value === filters.status);
      chips.push({
        key: 'status',
        label: 'Status',
        value: statusOption?.label || filters.status,
      });
    }

    if (filters.driveDate) {
      chips.push({
        key: 'driveDate',
        label: 'Drive Date',
        value: this.formatFilterDate(filters.driveDate),
      });
    }

    this.activeFilterChips = chips;
  }

  formatFilterDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  removeFilter(key: string): void {
    const filters = { ...this.currentFilters() };
    switch (key) {
      case 'status':
        delete filters.status;
        break;
      case 'driveDate':
        delete filters.driveDate;
        break;
    }
    this.currentFilters.set(filters);
    this.buildFilterChips();
  }

  clearAllFilters(): void {
    this.currentFilters.set({});
    this.activeFilterChips = [];
    this.searchTerm.set('');
  }

  getOverflowTooltip(): string {
    return this.activeFilterChips
      .slice(3)
      .map((chip) => `${chip.label}: ${chip.value}`)
      .join('\n');
  }

  onViewDrive(row: DriveSheetPrintStatusModel): void {
    // TODO: Implement view drive functionality
    console.log('View drive:', row.driveId);
  }

  getStatusLabel(status: string | null): string {
    if (!status) return '-';
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    return option ? option.label : status;
  }
}
