import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import {
  HoldReasonDialogData,
  DonationInterdictionModel,
  DonorInterdictionModel,
} from '../../models/deferrals-on-hold-query.model';
import { DeferralsOnHoldQueryService } from '../../services/deferrals-on-hold-query.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import moment from 'moment';

@Component({
  selector: 'app-hold-reason-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    DataTable,
  ],
  templateUrl: './hold-reason-dialog.html',
  styleUrls: ['./hold-reason-dialog.scss'],
})
export class HoldReasonDialog implements OnInit, OnDestroy {
  allDonationInterdictions: DonationInterdictionModel[] = [];
  allDonorInterdictions: DonorInterdictionModel[] = [];
  filteredDonationInterdictions: DonationInterdictionModel[] = [];
  filteredDonorInterdictions: DonorInterdictionModel[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  donationSelectionFilter = 'active';
  donorSelectionFilter = 'active';

  private destroy$ = new Subject<void>();

  donationInterdictionsTableConfig: DataTableConfig<DonationInterdictionModel> = {
    columns: [
      { key: 'type', header: 'Type', sortable: true, type: 'text', width: '100px' },
      { key: 'code', header: 'Code', sortable: false, type: 'text', width: '100px' },
      { key: 'description', header: 'Description', sortable: false, type: 'text', width: '250px' },
      {
        key: 'entryDate',
        header: 'Entry',
        sortable: false,
        type: 'text',
        width: '120px',
        valueFormatter: (value) => this.formatDate(value),
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        sortable: false,
        type: 'text',
        width: '130px',
        valueFormatter: (value) => this.formatDate(value),
      },
      { key: 'comment', header: 'Comment', sortable: false, type: 'text', width: '200px' },
    ],
    stickyHeader: true,
    showPagination: false,
    emptyMessage: 'No interdictions found',
    sortConfig: { column: 'type', direction: 'default' },
  };

  donorInterdictionsTableConfig: DataTableConfig<DonorInterdictionModel> = {
    columns: [
      { key: 'type', header: 'Type', sortable: true, type: 'text', width: '100px' },
      { key: 'code', header: 'Code', sortable: false, type: 'text', width: '100px' },
      { key: 'description', header: 'Description', sortable: false, type: 'text', width: '200px' },
      { key: 'originatedFrom', header: 'Originated From', sortable: false, type: 'text', width: '140px' },
      {
        key: 'entryDate',
        header: 'Entry',
        sortable: false,
        type: 'text',
        width: '120px',
        valueFormatter: (value) => this.formatDate(value),
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        sortable: false,
        type: 'text',
        width: '120px',
        valueFormatter: (value) => this.formatDate(value),
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        sortable: false,
        type: 'text',
        width: '130px',
        valueFormatter: (value) => this.formatDate(value),
      },
    ],
    stickyHeader: true,
    showPagination: false,
    emptyMessage: 'No donor interdictions found',
    sortConfig: { column: 'type', direction: 'default' },
  };

  selectionOptions = [
    { value: 'active', label: 'Active Holds' },
    { value: 'all', label: 'All' },
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: HoldReasonDialogData,
    private dialogRef: MatDialogRef<HoldReasonDialog>,
    private queryService: DeferralsOnHoldQueryService,
    private chapterTimezoneService: ChapterTimezoneService
  ) {}

  ngOnInit(): void {
    this.loadInterdictions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDonationSelectionChange(): void {
    this.filterDonationInterdictions();
  }

  onDonorSelectionChange(): void {
    this.filterDonorInterdictions();
  }

  onDonationSortChange(event: TableSortEvent): void {
    this.donationInterdictionsTableConfig.sortConfig!.column = event.column;
    this.donationInterdictionsTableConfig.sortConfig!.direction = event.direction;
    this.sortByType(this.filteredDonationInterdictions, event.direction);
  }

  onDonorSortChange(event: TableSortEvent): void {
    this.donorInterdictionsTableConfig.sortConfig!.column = event.column;
    this.donorInterdictionsTableConfig.sortConfig!.direction = event.direction;
    this.sortByType(this.filteredDonorInterdictions, event.direction);
  }

  onClose(): void {
    this.dialogRef.close();
  }

  private loadInterdictions(): void {
    this.isLoading = true;
    this.errorMessage = null;

    forkJoin({
      donationInterdictions: this.queryService.getDonationInterdictions(this.data.transactionId, false),
      donorInterdictions: this.queryService.getDonorInterdictions(this.data.transactionId, false),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allDonationInterdictions = response.donationInterdictions || [];
          this.allDonorInterdictions = response.donorInterdictions || [];
          this.filterDonationInterdictions();
          this.filterDonorInterdictions();
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'Failed to load interdiction data';
        },
      });
  }

  private filterDonationInterdictions(): void {
    if (this.donationSelectionFilter === 'active') {
      this.filteredDonationInterdictions = this.allDonationInterdictions.filter((h) =>
        this.isActive('', h.terminationDate)
      );
    } else {
      this.filteredDonationInterdictions = [...this.allDonationInterdictions];
    }
    this.sortByType(this.filteredDonationInterdictions, this.donationInterdictionsTableConfig.sortConfig!.direction);
  }

  private filterDonorInterdictions(): void {
    if (this.donorSelectionFilter === 'active') {
      this.filteredDonorInterdictions = this.allDonorInterdictions.filter((h) =>
        this.isActive(h.effectiveDate, h.terminationDate)
      );
    } else {
      this.filteredDonorInterdictions = [...this.allDonorInterdictions];
    }
    this.sortByType(this.filteredDonorInterdictions, this.donorInterdictionsTableConfig.sortConfig!.direction);
  }

  private isActive(effectiveDate: string, terminationDate: string): boolean {
    const today = this.chapterTimezoneService.getChapterLocalDate();
    if (effectiveDate && moment(effectiveDate).isAfter(today, 'day')) return false;
    if (!terminationDate) return true;
    return moment(terminationDate).isSameOrAfter(today, 'day');
  }

  private sortByType(items: { type: string }[], direction: string): void {
    if (direction === 'default') return;
    const multiplier = direction === 'A' ? 1 : -1;
    items.sort((a, b) => multiplier * a.type.localeCompare(b.type));
  }

  private formatDate(dateString: string): string {
    if (!dateString) return '--';
    const date = moment(dateString);
    if (!date.isValid()) return '--';
    return date.format('DD-MMM-YYYY').toUpperCase();
  }
}
