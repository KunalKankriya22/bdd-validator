import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subject, map, startWith, takeUntil } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TemporaryDriveFilterValue, FilterNameOption, StatusOption } from '../models/temporary-drive-query.model';
import { TemporaryDriveQueryService } from '../services/temporary-drive-query.service';

@Component({
  selector: 'app-temporary-drive-query-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './temporary-drive-query-filter-panel.html',
  styleUrls: ['./temporary-drive-query-filter-panel.scss']
})
export class TemporaryDriveQueryFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: TemporaryDriveFilterValue | null = null;
  @Output() apply = new EventEmitter<TemporaryDriveFilterValue>();
  @Output() close = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(TemporaryDriveQueryService);
  private destroy$ = new Subject<void>();

  filterForm!: FormGroup;

  // Status — static options, simple select
  statusOptions: StatusOption[] = [
    { code: 'U', description: 'Used' },
    { code: 'D', description: 'Deleted' }
  ];

  // Recruiter — from distinct data API
  recruiterNameOptions: FilterNameOption[] = [];
  filteredRecruiterNames$!: Observable<FilterNameOption[]>;
  isLoadingRecruiters = false;

  // Sponsor — from distinct data API
  sponsorNameOptions: FilterNameOption[] = [];
  filteredSponsorNames$!: Observable<FilterNameOption[]>;
  isLoadingSponsors = false;

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      status: [this.currentFilters?.status || null],
      recruiterName: [this.currentFilters?.recruiterName ? { name: this.currentFilters.recruiterName } as FilterNameOption : null],
      sponsorName: [this.currentFilters?.sponsorName ? { name: this.currentFilters.sponsorName } as FilterNameOption : null]
    });

    this.setupValueNormalization();
    this.loadFilterData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Recruiter name autocomplete ---
  private setupRecruiterNameFilter(): void {
    const control = this.filterForm.get('recruiterName');
    if (!control) return;
    this.filteredRecruiterNames$ = control.valueChanges.pipe(
      startWith(control.value || ''),
      map(value => {
        const text = typeof value === 'string' ? value : value?.name || '';
        return this.filterNames(this.recruiterNameOptions, text);
      })
    );
  }

  // --- Sponsor name autocomplete ---
  private setupSponsorNameFilter(): void {
    const control = this.filterForm.get('sponsorName');
    if (!control) return;
    this.filteredSponsorNames$ = control.valueChanges.pipe(
      startWith(control.value || ''),
      map(value => {
        const text = typeof value === 'string' ? value : value?.name || '';
        return this.filterNames(this.sponsorNameOptions, text);
      })
    );
  }

  private filterNames(options: FilterNameOption[], text: string): FilterNameOption[] {
    if (!text) return options;
    const lower = text.toLowerCase();
    return options.filter(o => o.name.toLowerCase().includes(lower));
  }

  displayName = (option: FilterNameOption): string => {
    return option ? option.name : '';
  };

  // --- Value normalization (empty string → null) ---
  private setupValueNormalization(): void {
    ['recruiterName', 'sponsorName'].forEach(field => {
      this.filterForm.get(field)?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(value => {
          if (typeof value === 'string' && value.trim() === '') {
            this.filterForm.get(field)?.setValue(null, { emitEvent: false });
          }
        });
    });
  }

  // --- Load filter data from API (distinct from actual data) ---
  private loadFilterData(): void {
    this.isLoadingRecruiters = true;
    this.service.getFilterRecruiters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.recruiterNameOptions = response.data;
          this.isLoadingRecruiters = false;
          this.setupRecruiterNameFilter();
        },
        error: () => {
          this.recruiterNameOptions = [];
          this.isLoadingRecruiters = false;
        }
      });

    this.isLoadingSponsors = true;
    this.service.getFilterSponsors()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.sponsorNameOptions = response.data;
          this.isLoadingSponsors = false;
          this.setupSponsorNameFilter();
        },
        error: () => {
          this.sponsorNameOptions = [];
          this.isLoadingSponsors = false;
        }
      });
  }

  // --- Blur / Enter / Selected handlers ---
  onRecruiterBlur(): void {
    const control = this.filterForm.get('recruiterName');
    if (!control) return;
    const value = control.value;
    if (typeof value === 'string' && value.trim().length > 0) {
      control.setErrors({ invalidRecruiter: true });
      control.markAsTouched();
    } else if (typeof value === 'string') {
      control.setValue(null);
      control.setErrors(null);
    }
  }

  onRecruiterEnter(event: Event): void {
    event.preventDefault();
    this.onRecruiterBlur();
    (event.target as HTMLElement).blur();
  }

  onRecruiterSelected(): void {
    const control = this.filterForm.get('recruiterName');
    if (control) control.setErrors(null);
  }

  onSponsorBlur(): void {
    const control = this.filterForm.get('sponsorName');
    if (!control) return;
    const value = control.value;
    if (typeof value === 'string' && value.trim().length > 0) {
      control.setErrors({ invalidSponsor: true });
      control.markAsTouched();
    } else if (typeof value === 'string') {
      control.setValue(null);
      control.setErrors(null);
    }
  }

  onSponsorEnter(event: Event): void {
    event.preventDefault();
    this.onSponsorBlur();
    (event.target as HTMLElement).blur();
  }

  onSponsorSelected(): void {
    const control = this.filterForm.get('sponsorName');
    if (control) control.setErrors(null);
  }

  get isApplyDisabled(): boolean {
    const f = this.filterForm.getRawValue();
    const hasObject = (v: any) => typeof v === 'object' && v !== null;
    const hasValue = (v: any) => v !== null && v !== undefined && v !== '';
    const anySelected = hasValue(f.status) || hasObject(f.recruiterName) || hasObject(f.sponsorName);
    if (!anySelected) return true;
    // Reject partial typed text
    if (typeof f.recruiterName === 'string' && f.recruiterName.trim().length > 0) return true;
    if (typeof f.sponsorName === 'string' && f.sponsorName.trim().length > 0) return true;
    return false;
  }

  // --- Actions ---
  onApply(): void {
    const formValue = this.filterForm.getRawValue();

    const filters: TemporaryDriveFilterValue = {
      status: formValue.status || null,
      recruiterName: (typeof formValue.recruiterName === 'object' && formValue.recruiterName)
        ? formValue.recruiterName.name : null,
      sponsorName: (typeof formValue.sponsorName === 'object' && formValue.sponsorName)
        ? formValue.sponsorName.name : null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      status: null,
      recruiterName: null,
      sponsorName: null
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
