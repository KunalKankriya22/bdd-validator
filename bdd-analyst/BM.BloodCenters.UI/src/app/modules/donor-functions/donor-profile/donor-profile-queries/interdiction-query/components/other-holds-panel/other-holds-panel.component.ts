import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';
import { InterdictionQueryService } from '../../services/interdiction-query.service';
import { OtherHold } from '../../models/interdiction-query.model';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';

export interface OtherHoldsPanelData {
  transactionId: string;       // Required: Transaction ID for querying holds
  unitId: string;              // Display only
  collectionDate?: string;     // Display only
  driveId?: string;            // Display only
}

@Component({
  selector: 'app-other-holds-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    DataTable
  ],
  templateUrl: './other-holds-panel.component.html',
  styleUrls: ['./other-holds-panel.component.scss']
})
export class OtherHoldsPanelComponent implements OnInit, OnDestroy {
  @Input() data!: OtherHoldsPanelData;
  @Output() close = new EventEmitter<void>();

  private interdictionQueryService = inject(InterdictionQueryService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  filterForm!: FormGroup;
  otherHolds = signal<OtherHold[]>([]);
  isLoading = signal(true);
  hasError = signal(false);
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'A' | 'D'>('D');

  // All holds are returned from API based on showTerminated parameter
  // Apply client-side sorting
  filteredHolds = computed(() => {
    const holds = [...this.otherHolds()];
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (!column) {
      return holds;
    }

    return holds.sort((a, b) => {
      const aValue = (a as any)[column];
      const bValue = (b as any)[column];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Compare values
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else {
        comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }

      // Apply sort direction
      return direction === 'A' ? comparison : -comparison;
    });
  });

  // Data table configuration - matching backend OtherHoldsResultDto
  get tableConfig(): DataTableConfig<OtherHold> {
    return {
      columns: [
        {
          key: 'interCode',
          header: 'Hold Code',
          sortable: true,
          valueFormatter: (value) => value || '-'
        },
        {
          key: 'interDesc',
          header: 'Description',
          sortable: false,
          valueFormatter: (value) => value || '-'
        },
        {
          key: 'originatedFrom',
          header: 'Origin',
          sortable: false,
          valueFormatter: (value) => value || '-'
        },
        {
          key: 'reasonCode',
          header: 'Reason Code',
          sortable: false,
          valueFormatter: (value) => value || '-'
        },
        {
          key: 'effDate',
          header: 'Effective Date',
          sortable: false,
          valueFormatter: (value) => value ? moment(value).format('DD-MMM-YYYY').toUpperCase() : '-'
        },
        {
          key: 'termDate',
          header: 'Termination Date',
          sortable: false,
          valueFormatter: (value) => value ? moment(value).format('DD-MMM-YYYY').toUpperCase() : '-'
        }
      ],
      sortConfig: this.sortColumn() ? {
        column: this.sortColumn()!,
        direction: this.sortDirection()
      } : undefined,
      stickyHeader: true,
      showTableOnEmpty: false,
      noDataIcon: 'search',
      emptyMessage: 'No Results to Display',
      emptySubMessage: 'No holds found for this unit',
      enableRowHighlight: false
    };
  }

  ngOnInit(): void {
    this.initializeForm();
    this.subscribeToFormChanges();
    // Load holds with initial default value
    this.loadOtherHolds();
  }

  private initializeForm(): void {
    // Initialize form with default value 'No' for showTerminated
    this.filterForm = this.fb.group({
      showTerminated: ['No']
    });
  }

  private subscribeToFormChanges(): void {
    this.filterForm.get('showTerminated')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        console.log('Other Holds Panel - Show Terminated changed to:', value);
        this.loadOtherHolds();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOtherHolds(): void {
    if (!this.data?.transactionId) {
      console.error('Other Holds Panel - Transaction ID is required');
      this.hasError.set(true);
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.hasError.set(false);

    // Get showTerminated value from form, with proper fallback to 'No'
    const showTerminatedValue: string = this.filterForm?.get('showTerminated')?.value ?? 'No';
    const showTerminatedBool: boolean = showTerminatedValue === 'Yes';

    console.log('Other Holds Panel - API Request:', {
      transactionId: this.data.transactionId,
      showTerminatedFormValue: showTerminatedValue,
      showTerminatedBoolean: showTerminatedBool,
      endpoint: 'POST /api/v1/donor-interdictions/other-holds'
    });

    this.interdictionQueryService
      .getOtherHolds(this.data.transactionId, showTerminatedBool)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (holds) => {
          console.log('Other Holds Panel - Received', holds?.length || 0, 'holds');
          this.otherHolds.set(holds || []);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Other Holds Panel - Error:', error);
          this.hasError.set(true);
          this.isLoading.set(false);
        }
      });
  }

  onClose(): void {
    this.close.emit();
  }

  /**
   * Handle sort change from data table
   */
  onSortChange(event: TableSortEvent): void {
    this.sortColumn.set(event.column);
    // Handle 'default' direction by treating it as descending
    const direction = event.direction === 'default' ? 'D' : event.direction;
    this.sortDirection.set(direction);
  }

  /**
   * Format date for display
   * @param date - Date string, null, or undefined
   * @returns Formatted date string or '-' for invalid/null dates
   */
  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  /**
   * Display value or dash for empty/null values
   * @param value - Any value to display
   * @returns String representation or '-' for empty/null values
   */
  displayValue(value: any): string {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'string' && value.trim() === '') return '-';
    return String(value);
  }
}
