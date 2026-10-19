import { Component, Inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import {
  UnitHoldsDialogData,
  UnitHoldRecord,
  UnitHoldsQueryResponse
} from '../../models/graded-donors-query.model';
import { GradedDonorsQueryService } from '../../services/graded-donors-query.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';

/**
 * Unit Holds Dialog Component
 *
 * Displays holds placed on a selected unit/deferral
 * Read-only view with session information and holds table
 */
@Component({
  selector: 'app-unit-holds-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTable
  ],
  templateUrl: './unit-holds-dialog.html',
  styleUrls: ['./unit-holds-dialog.scss']
})
export class UnitHoldsDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Signals for reactive state
  unitHolds = signal<UnitHoldRecord[]>([]);
  isLoading = signal(true);
  hasError = signal(false);

  // Table configuration
  tableConfig: DataTableConfig<UnitHoldRecord> = {
    columns: [
      { key: 'type', header: 'Type', sortable: true, width: '15%' },
      { key: 'code', header: 'Code', sortable: false, width: '15%' },
      { key: 'description', header: 'Description', sortable: false, width: '40%' },
      { key: 'entryDate', header: 'Entry Date', sortable: false, width: '15%' },
      { key: 'terminationDate', header: 'Termination Date', sortable: false, width: '15%' }
    ],
    stickyHeader: false,
    showPagination: false,
    emptyMessage: 'No unit holds found for this unit.',
    sortConfig: {
      column: '',
      direction: 'default'
    }
  };

  constructor(
    public dialogRef: MatDialogRef<UnitHoldsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UnitHoldsDialogData,
    private gradedDonorsQueryService: GradedDonorsQueryService,
    private headerService: HeaderService,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    this.loadUnitHolds();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load unit holds from API
   */
  private loadUnitHolds(): void {
    const chapterId = this.headerService.getCurrentChapterId();
    const userId = this.loginService.getStoredUsername();

    if (!chapterId || !userId || !this.data.transactionId) {
      this.hasError.set(true);
      this.isLoading.set(false);
      return;
    }

    this.gradedDonorsQueryService
      .queryUnitHolds(this.data.transactionId, chapterId, userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: UnitHoldsQueryResponse) => {
          this.isLoading.set(false);
          if (response.success) {
            this.unitHolds.set(response.data || []);
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