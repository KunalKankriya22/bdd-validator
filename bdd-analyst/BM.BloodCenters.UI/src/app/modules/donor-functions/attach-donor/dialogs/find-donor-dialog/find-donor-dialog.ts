import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';
import { FindDonorService } from '@shared/components/find-donor/find-donor.service';
import { AttachDonorService } from '../../services/attach-donor.service';
import { FindDonorSearchCriteria, FindDonorResult } from '@shared/components/find-donor/find-donor.model';
import { DonorSearchCriteria, DonorSearchResult } from '../../models/attach-donor.model';

/**
 * Find Donor Dialog Data
 */
export interface FindDonorDialogData {
  transactionId: string;
}

/**
 * Find Donor Dialog Result
 * Returned when dialog closes
 */
export interface FindDonorDialogResult {
  type: 'select' | 'hold' | 'new';
  donor?: DonorSearchResult;  // For select and hold actions
}

/**
 * Find Donor Dialog Component
 * Allows searching for donors and selecting one to attach
 * Based on Figma screenshot AttachDonor4.png
 */
@Component({
  selector: 'app-find-donor-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './find-donor-dialog.html',
  styleUrl: './find-donor-dialog.scss'
})
export class FindDonorDialogComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `find-donor-dialog-${FindDonorDialogComponent.nextId++}`;

  private readonly fb = inject(FormBuilder);
  readonly data = inject<FindDonorDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<FindDonorDialogComponent>);
  private readonly findDonorService = inject(FindDonorService);
  private readonly attachDonorService = inject(AttachDonorService);
  private readonly destroy$ = new Subject<void>();

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Signal-based state
  protected readonly searchResults = signal<DonorSearchResult[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedDonor = signal<DonorSearchResult | null>(null);
  protected readonly pageSize = signal<number>(10);
  protected readonly pageIndex = signal<number>(0);

  // Computed values
  protected readonly isEmpty = computed(() => this.searchResults().length === 0);
  protected readonly hasResults = computed(() => this.searchResults().length > 0);
  protected readonly totalRecords = computed(() => this.searchResults().length);
  protected readonly pagedResults = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    const end = start + this.pageSize();
    return this.searchResults().slice(start, end);
  });

  // Form
  searchForm!: FormGroup;

  // Table columns
  displayedColumns: string[] = ['select', 'donorId', 'lastName', 'firstName', 'dateOfBirth', 'sex', 'alternateId'];

  // Dropdown options
  typeOptions = ['SSN', 'DL', 'PP', 'Other']; // TODO: Get from API or constants
  sexOptions = ['M', 'F', 'U'];

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      scanId: [''],
      donorId: [''],
      type: [''],
      alternateId: [''],
      lastName: [''],
      dateOfBirth: [null],
      sex: [''],
      firstName: ['']
    });
  }

  get f() {
    return this.searchForm.controls;
  }

  /**
   * Search for donors based on criteria
   */
  onSearch(): void {
    if (this.searchForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValues = this.searchForm.value;

    // Map form values to API search criteria
    const criteria: FindDonorSearchCriteria = {
      scanId: formValues.scanId || undefined,
      donorId: formValues.donorId || undefined,
      alternateIdType: formValues.type || undefined,
      alternateId: formValues.alternateId || undefined,
      lastName: formValues.lastName || undefined,
      firstName: formValues.firstName || undefined,
      dob: formValues.dateOfBirth ? moment(formValues.dateOfBirth).format('YYYY-MM-DD') : undefined,
      sex: formValues.sex || undefined
    };

    // Call Find Donor API
    this.findDonorService.searchDonors(criteria)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Map API results to dialog format
          const mappedResults: DonorSearchResult[] = response.data.map(donor => ({
            donorId: donor.donorId ?? '',
            lastName: donor.lastName ?? '',
            firstName: donor.firstName ?? '',
            dateOfBirth: (donor.dob ?? null) as string | null,
            sex: donor.sex ?? null,
            alternateId: donor.alternateId ?? null
          }));

          this.searchResults.set(mappedResults);
          this.loading.set(false);
          this.pageIndex.set(0);

          if (mappedResults.length === 0) {
            this.error.set('No donors found matching search criteria');
          }
        },
        error: (err) => {
          // error displayed in dialog UI
          this.error.set(err?.message || 'Failed to search donors. Please try again.');
          this.loading.set(false);
          this.searchResults.set([]);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Clear search form and results
   */
  onClear(): void {
    this.searchForm.reset();
    this.searchResults.set([]);
    this.selectedDonor.set(null);
    this.error.set(null);
    this.pageIndex.set(0);
  }

  /**
   * Select a donor from the results
   */
  onSelectDonor(donor: DonorSearchResult): void {
    this.selectedDonor.set(donor);
  }

  /**
   * Confirm selection and close dialog with selected donor
   */
  onSelect(): void {
    const selected = this.selectedDonor();
    if (!selected) {
      this.error.set('Please select a donor first');
      return;
    }

    // Close dialog with selected donor info
    const result: FindDonorDialogResult = {
      type: 'select',
      donor: selected
    };
    this.dialogRef.close(result);
  }

  /**
   * Navigate to donor registration to create new donor
   */
  onNew(): void {
    // Close dialog and signal that NEW donor should be created
    const result: FindDonorDialogResult = {
      type: 'new'
    };
    this.dialogRef.close(result);
  }

  /**
   * Put donor on hold
   * Calls API to set donor hold status, then closes dialog with held donor info
   */
  onHold(): void {
    const selected = this.selectedDonor();
    if (!selected) {
      this.error.set('Please select a donor first');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.attachDonorService.putDonorOnHold(selected.donorId, this.data.transactionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          // Close dialog with held donor info
          const result: FindDonorDialogResult = {
            type: 'hold',
            donor: selected
          };
          this.dialogRef.close(result);
        },
        error: (err) => {
          // error displayed in dialog UI
          this.error.set(err?.message || 'Failed to put donor on hold');
          this.loading.set(false);
        }
      });
  }

  /**
   * Cancel and close dialog
   */
  onCancel(): void {
    this.dialogRef.close(null);
  }

  /**
   * Handle page change event
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  /**
   * Check if a donor is selected
   */
  isSelected(donor: DonorSearchResult): boolean {
    const selected = this.selectedDonor();
    return selected?.donorId === donor.donorId;
  }
}
