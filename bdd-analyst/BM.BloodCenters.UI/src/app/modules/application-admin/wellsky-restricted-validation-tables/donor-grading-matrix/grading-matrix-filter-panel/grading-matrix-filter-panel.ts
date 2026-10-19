import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import {
  DonorGradingMatrixFilterValue,
  NAME_MATCH_OPTIONS,
  DOB_MATCH_OPTIONS,
  GENDER_MATCH_OPTIONS,
  GRADE_OPTIONS
} from '../models/donor-grading-matrix.model';

@Component({
  selector: 'app-grading-matrix-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './grading-matrix-filter-panel.html',
  styleUrls: ['./grading-matrix-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GradingMatrixFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: DonorGradingMatrixFilterValue | null = null;
  @Output() apply = new EventEmitter<DonorGradingMatrixFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  nameMatchOptions = NAME_MATCH_OPTIONS;
  dobMatchOptions = DOB_MATCH_OPTIONS;
  genderMatchOptions = GENDER_MATCH_OPTIONS;
  gradeOptions = GRADE_OPTIONS;

  // Filtered options for searchable dropdowns
  filteredFirstnameOptions = [...NAME_MATCH_OPTIONS];
  filteredLastnameOptions = [...NAME_MATCH_OPTIONS];
  filteredDobOptions = [...DOB_MATCH_OPTIONS];
  filteredGenderOptions = [...GENDER_MATCH_OPTIONS];
  filteredGradeOptions = [...GRADE_OPTIONS];

  // Search controls for each dropdown
  firstnameSearchControl = new FormControl('');
  lastnameSearchControl = new FormControl('');
  dobSearchControl = new FormControl('');
  genderSearchControl = new FormControl('');
  gradeSearchControl = new FormControl('');

  private initialFormValue: any = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      firstnameMatch: [this.currentFilters?.firstnameMatch || null],
      lastnameMatch: [this.currentFilters?.lastnameMatch || null],
      dobMatch: [this.currentFilters?.dobMatch || null],
      genderMatch: [this.currentFilters?.genderMatch || null],
      grade: [this.currentFilters?.grade || null]
    });

    // Store initial form value for comparison
    this.initialFormValue = this.filterForm.value;

    // Setup search filters
    this.setupSearchFilters();

    // Listen to all form value changes to update Apply button state
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchFilters(): void {
    // Firstname search filter
    this.firstnameSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredFirstnameOptions = this.nameMatchOptions.filter(option =>
          option.label.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });

    // Lastname search filter
    this.lastnameSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredLastnameOptions = this.nameMatchOptions.filter(option =>
          option.label.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });

    // DOB search filter
    this.dobSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredDobOptions = this.dobMatchOptions.filter(option =>
          option.label.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });

    // Gender search filter
    this.genderSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredGenderOptions = this.genderMatchOptions.filter(option =>
          option.label.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });

    // Grade search filter
    this.gradeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredGradeOptions = this.gradeOptions.filter(option =>
          option.label.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });
  }

  get isApplyDisabled(): boolean {
    // Check if any field has a value
    const formValue = this.filterForm?.value;
    if (!formValue) {
      return true;
    }

    const hasAnyValue =
      formValue.firstnameMatch !== null ||
      formValue.lastnameMatch !== null ||
      formValue.dobMatch !== null ||
      formValue.genderMatch !== null ||
      formValue.grade !== null;

    if (!hasAnyValue) {
      return true;
    }

    // Check if form has changed from initial state
    const hasChanged = JSON.stringify(formValue) !== JSON.stringify(this.initialFormValue);

    return !hasChanged;
  }

  onApply(): void {
    const formValue = this.filterForm.value;

    const filters: DonorGradingMatrixFilterValue = {
      firstnameMatch: formValue.firstnameMatch || null,
      lastnameMatch: formValue.lastnameMatch || null,
      dobMatch: formValue.dobMatch || null,
      genderMatch: formValue.genderMatch || null,
      grade: formValue.grade != null ? formValue.grade : null
    };

    // Update initial form value to current state after applying
    this.initialFormValue = this.filterForm.value;

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      firstnameMatch: null,
      lastnameMatch: null,
      dobMatch: null,
      genderMatch: null,
      grade: null
    });

    // Update initial form value after clearing
    this.initialFormValue = this.filterForm.value;

    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }
}
