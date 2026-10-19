import { Component, Inject, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule, Sort } from '@angular/material/sort';
import { Subject, takeUntil, catchError, of } from 'rxjs';

import { ViewDonorsInListService } from './view-donors-in-list.service';
import {
  ViewDonorsInListDialogData,
  ViewDonorsInListDialogResult,
  DonorInList,
  DonorListInfo
} from './view-donors-in-list.model';

@Component({
  selector: 'app-view-donors-in-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSortModule
  ],
  templateUrl: './view-donors-in-list.html',
  styleUrls: ['./view-donors-in-list.scss']
})
export class ViewDonorsInListDialog implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly viewDonorsService = inject(ViewDonorsInListService);
  private readonly destroy$ = new Subject<void>();

  listForm!: FormGroup;
  availableListIds: string[] = [];
  listInfo: DonorListInfo | null = null;
  dataSource = new MatTableDataSource<DonorInList>([]);
  loading = false;
  hasRetrieved = false;
  errorMessage: string | null = null;
  errorCode: string | null = null;

  displayedColumns: string[] = [
    'donorId',
    'lastName',
    'firstName',
    'sex',
    'homePhoneInternational',
    'businessPhoneInternational',
    'lockBy',
    'donorStatus'
  ];

  constructor(
    public dialogRef: MatDialogRef<ViewDonorsInListDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ViewDonorsInListDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadAvailableListIds();

    if (this.data?.listId) {
      this.listForm.patchValue({ listId: this.data.listId });
      this.onRetrieve();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.listForm = this.fb.group({
      listId: ['']
    });
  }

  private loadAvailableListIds(): void {
    this.viewDonorsService.getAvailableListIds()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (listIds) => {
          this.availableListIds = listIds;
        },
        error: () => {
          this.availableListIds = [];
        }
      });
  }

  onRetrieve(): void {
    const listId = this.listForm.get('listId')?.value;
    if (!listId) {
      return;
    }

    this.loading = true;
    this.hasRetrieved = true;
    this.errorMessage = null;
    this.errorCode = null;

    this.viewDonorsService.getDonorsByListId(listId)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          this.loading = false;
          this.dataSource.data = [];
          this.listInfo = null;

          if (error?.error?.errorResponse) {
            this.errorCode = error.error.errorResponse.errorCode;
            this.errorMessage = error.error.errorResponse.error;
          } else {
            this.errorMessage = 'An error occurred while retrieving donor list';
          }

          return of({
            success: false,
            message: '',
            statusCode: 500,
            data: { listInfo: null as any, donors: [] },
            total: 0,
            errorResponse: { errorCode: null, error: null }
          });
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.listInfo = response.data.listInfo;
            this.dataSource.data = response.data.donors;
          }
          this.loading = false;
        }
      });
  }

  onSortChange(sort: Sort): void {
    const data = this.dataSource.data.slice();

    if (!sort.active || sort.direction === '') {
      this.dataSource.data = data;
      return;
    }

    this.dataSource.data = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'donorId':
          return this.compare(a.donorId, b.donorId, isAsc);
        case 'lastName':
          return this.compare(a.lastName, b.lastName, isAsc);
        case 'firstName':
          return this.compare(a.firstName, b.firstName, isAsc);
        case 'sex':
          return this.compare(a.sex, b.sex, isAsc);
        case 'homePhoneInternational':
          return this.compare(a.homePhoneInternational, b.homePhoneInternational, isAsc);
        case 'businessPhoneInternational':
          return this.compare(a.businessPhoneInternational, b.businessPhoneInternational, isAsc);
        case 'lockBy':
          return this.compare(a.lockBy, b.lockBy, isAsc);
        case 'donorStatus':
          return this.compare(a.donorStatus, b.donorStatus, isAsc);
        default:
          return 0;
      }
    });
  }

  private compare(a: string | number, b: string | number, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  onClose(): void {
    this.dialogRef.close({ action: 'close' } as ViewDonorsInListDialogResult);
  }

  closeError(): void {
    this.errorMessage = null;
    this.errorCode = null;
  }

  get isRetrieveDisabled(): boolean {
    return !this.listForm.get('listId')?.value || this.loading;
  }

  get showEmptyState(): boolean {
    return !this.loading && this.hasRetrieved && this.dataSource.data.length === 0;
  }

  /**
   * Clear all form data and results
   */
  onClearAll(): void {
    this.listForm.reset();
    this.dataSource.data = [];
    this.listInfo = null;
    this.hasRetrieved = false;
    this.errorMessage = null;
    this.errorCode = null;
  }

  /**
   * Format a value for display (handles null/empty values)
   */
  formatValue(value: string | number | null | undefined): string {
    if (value == null) return '---';
    const str = String(value).trim();
    return str || '---';
  }
}
