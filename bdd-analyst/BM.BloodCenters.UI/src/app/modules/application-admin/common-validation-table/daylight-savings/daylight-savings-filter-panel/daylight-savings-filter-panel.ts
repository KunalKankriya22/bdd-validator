import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { DaylightSavingsFilterValue } from '../models/daylight-savings.model';
import { DaylightSavingsService } from '../services/daylight-savings.service';

@Component({
  selector: 'app-daylight-savings-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './daylight-savings-filter-panel.html',
  styleUrls: ['./daylight-savings-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DaylightSavingsFilterPanel implements OnInit, OnDestroy {

  @Input() currentFilters: DaylightSavingsFilterValue | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() apply = new EventEmitter<DaylightSavingsFilterValue>();

  filterForm!: FormGroup;

  chapterIdOptions: string[] = [];
  chapterNameOptions: string[] = [];
  timeZoneOptions: string[] = [];

  // Filtered options for searchable dropdowns (Donor User Access pattern)
  filteredChapterIdOptions: string[] = [];
  filteredChapterNameOptions: string[] = [];
  filteredTimeZoneOptions: string[] = [];

  // Search controls for dropdowns
  chapterIdSearchControl = new FormControl('');
  chapterNameSearchControl = new FormControl('');
  timeZoneSearchControl = new FormControl('');

  isLoadingFilters = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private daylightSavingsService: DaylightSavingsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadFilterOptions();
    this.setupSearchControls();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ------------------------------ FORM INIT ------------------------------ */

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      chapterId: [this.currentFilters?.chapterId ?? null],
      chapterName: [this.currentFilters?.chapterName ?? null],
      timeZone: [this.currentFilters?.timeZone ?? null],
      dstOffSet: [this.currentFilters?.dstOffSet ?? null, [Validators.min(0), Validators.max(120), this.integerValidator]]
    });
  }

  /* ------------------------------ CUSTOM VALIDATORS ------------------------------ */

  private integerValidator(control: any): { [key: string]: any } | null {
    if (control.value === null || control.value === '') {
      return null;
    }
    const value = parseFloat(control.value);
    if (isNaN(value)) {
      return null;
    }
    // Check if the value is not an integer
    if (!Number.isInteger(value)) {
      return { notInteger: true };
    }
    return null;
  }

  /* ------------------------------ LOAD OPTIONS ------------------------------ */

  private loadFilterOptions(): void {
    this.isLoadingFilters = true;

    this.daylightSavingsService
      .getDaylightSavingsFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const filterData = response.data?.[0];

          if (filterData) {
            this.chapterIdOptions = filterData.chapterId ?? [];
            this.chapterNameOptions = filterData.chapterName ?? [];
            this.timeZoneOptions = filterData.timeZone ?? [];

            // Initialize filtered options (Donor User Access pattern)
            this.filteredChapterIdOptions = [...this.chapterIdOptions];
            this.filteredChapterNameOptions = [...this.chapterNameOptions];
            this.filteredTimeZoneOptions = [...this.timeZoneOptions];
          }

          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.chapterIdOptions = [];
          this.chapterNameOptions = [];
          this.timeZoneOptions = [];
          this.filteredChapterIdOptions = [];
          this.filteredChapterNameOptions = [];
          this.filteredTimeZoneOptions = [];

          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        }
      });
  }

  /* ------------------------------ SEARCH SETUP (Donor User Access pattern) ------------------------------ */

  private setupSearchControls(): void {
    // Chapter ID search
    this.chapterIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredChapterIdOptions = this.chapterIdOptions.filter(id =>
          id.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });

    // Chapter Name search
    this.chapterNameSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredChapterNameOptions = this.chapterNameOptions.filter(name =>
          name.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });

    // Time Zone search
    this.timeZoneSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredTimeZoneOptions = this.timeZoneOptions.filter(tz =>
          tz.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });
  }

  /* ------------------------------ ACTIONS ------------------------------ */

  onApply(): void {
    const formValue = this.filterForm.getRawValue();

    const filters: DaylightSavingsFilterValue = {
      chapterId: formValue.chapterId ?? null,
      chapterName: formValue.chapterName ?? null,
      timeZone: formValue.timeZone ?? null,
      dstOffSet: formValue.dstOffSet ?? null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      chapterId: null,
      chapterName: null,
      timeZone: null,
      dstOffSet: null
    });
  }

  onClose(): void {
    this.close.emit();
  }

  /* ------------------------------ INPUT VALIDATION ------------------------------ */

  preventInvalidNumberInput(event: KeyboardEvent): void {
    // Prevent 'e', 'E', '+', '-' from being entered in number fields
    if (event.key === 'e' || event.key === 'E' || event.key === '+' || event.key === '-') {
      event.preventDefault();
    }
  }

  onDstOffsetInput(): void {
    const control = this.filterForm.get('dstOffSet');
    if (!control) return;

    control.markAsTouched();
    control.markAsDirty();
    this.cdr.markForCheck();
  }

  get isApplyDisabled(): boolean {
    if (!this.filterForm) {
      return true;
    }

    const formValue = this.filterForm.value;

    // Check if at least one field has a value
    const hasAnyValue =
      (formValue.chapterId !== null && formValue.chapterId !== '') ||
      (formValue.chapterName !== null && formValue.chapterName !== '') ||
      (formValue.timeZone !== null && formValue.timeZone !== '') ||
      (formValue.dstOffSet !== null && formValue.dstOffSet !== '');

    // Disable if form is invalid (e.g., DST offset out of range)
    return !hasAnyValue || this.filterForm.invalid;
  }

  getDstOffsetError(): string {
    const control = this.filterForm.get('dstOffSet');
    if (!control) return '';

    if (!(control.touched || control.dirty)) return '';

    if (control.hasError('notInteger')) {
      return 'Enter valid number';
    }
    if (control.hasError('min')) {
      return 'DST Offset must be at least 0';
    }
    if (control.hasError('max')) {
      return 'DST Offset cannot exceed 120 minutes';
    }
    return '';
  }
}
