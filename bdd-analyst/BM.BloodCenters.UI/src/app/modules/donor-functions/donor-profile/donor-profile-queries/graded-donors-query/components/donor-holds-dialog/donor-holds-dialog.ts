import { Component, Inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import {
  DonorHoldsDialogData,
  DonorHoldRecord,
  DonorHoldsQueryResponse
} from '../../models/graded-donors-query.model';
import { GradedDonorsQueryService } from '../../services/graded-donors-query.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';

/**
 * Donor Holds Dialog Component
 *
 * Displays holds placed on a selected donor
 * Read-only view with session information and holds table
 */
@Component({
  selector: 'app-donor-holds-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTable
  ],
  templateUrl: './donor-holds-dialog.html',
  styleUrls: ['./donor-holds-dialog.scss']
})
export class DonorHoldsDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Signals for reactive state
  donorHolds = signal<DonorHoldRecord[]>([]);
  isLoading = signal(true);
  hasError = signal(false);

  // Table configuration
  tableConfig: DataTableConfig<DonorHoldRecord> = {
    columns: [
      { key: 'type', header: 'Type', sortable: true, width: '12%' },
      { key: 'code', header: 'Code', sortable: false, width: '10%' },
      { key: 'description', header: 'Description', sortable: false, width: '28%' },
      { key: 'unitId', header: 'Unit ID', sortable: false, width: '12%' },
      { key: 'entryDate', header: 'Entry Date', sortable: false, width: '13%' },
      { key: 'effectiveDate', header: 'Effective Date', sortable: false, width: '13%' },
      { key: 'terminationDate', header: 'Termination Date', sortable: false, width: '12%' }
    ],
    stickyHeader: false,
    showPagination: false,
    emptyMessage: 'No donor holds found for this donor.',
    sortConfig: {
      column: '',
      direction: 'default'
    }
  };

  constructor(
    public dialogRef: MatDialogRef<DonorHoldsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DonorHoldsDialogData,
    private gradedDonorsQueryService: GradedDonorsQueryService,
    private headerService: HeaderService,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    this.loadDonorHolds();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load donor holds from API
   */
  private loadDonorHolds(): void {
    const chapterId = this.headerService.getCurrentChapterId();
    const userId = this.loginService.getStoredUsername();

    if (!chapterId || !userId) {
      this.hasError.set(true);
      this.isLoading.set(false);
      return;
    }

    this.gradedDonorsQueryService
      .queryDonorHolds(this.data.donorId, chapterId, userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: DonorHoldsQueryResponse) => {
          this.isLoading.set(false);
          if (response.success) {
            this.donorHolds.set(response.data || []);
          } else {
            this.hasError.set(true);
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.hasError.set(true);
        }
      });
  }

  /**
   * Close dialog
   */
  onClose(): void {
    this.dialogRef.close();
  }

  /**
   * Get full name (Last First) - no comma when name is blank
   */
  get fullName(): string {
    const lastName = this.data.lastName?.trim() || '';
    const firstName = this.data.firstName?.trim() || '';

    if (!lastName && !firstName) {
      return '-';
    }

    if (!lastName) {
      return firstName;
    }

    if (!firstName) {
      return lastName;
    }

    return `${lastName} ${firstName}`;
  }

  /**
   * Get full sex label (Male/Female instead of M/F)
   */
  get sexLabel(): string {
    const sex = this.data.sex?.trim().toUpperCase();
    if (sex === 'M') return 'Male';
    if (sex === 'F') return 'Female';
    return sex || '-';
  }

  /**
   * Handle sort change from data-table
   */
  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }
  }
}