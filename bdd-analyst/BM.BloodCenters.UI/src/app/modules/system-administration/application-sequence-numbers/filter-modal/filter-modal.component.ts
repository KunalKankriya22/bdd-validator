import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { UI } from '../../../../core/constants/ui.constants';
import {
  ApplicationSequenceNumberFilterParams,
  ApplicationSequenceNumberFilterDropdownDto,
} from '../interfaces/application-sequence-number.interface';
import { RESET_CYCLE_OPTIONS } from '../models/reset-cycle.enum';
import { ApplicationSequenceNumbersApiService } from '../services/application-sequence-numbers-api.service';
import { LoggingService } from '@shared/services/logging.service';

/**
 * Dialog data structure - includes current filters only (no data)
 * Data is now fetched from backend API on modal open
 */
export interface FilterModalData {
  currentFilters: ApplicationSequenceNumberFilterParams;
}

/**
 * Filter Modal Component for Application Sequence Numbers
 * Provides filtering by Chapter ID, Chapter Name, Number Type, and Cycle
 * Loads filter options from backend API on modal open
 */
@Component({
  selector: 'app-filter-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    TranslateModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './filter-modal.component.html',
  styleUrl: './filter-modal.component.scss',
})
export class FilterModalComponent implements OnInit {
  // Inject dependencies
  private dialogRef = inject(MatDialogRef<FilterModalComponent>);
  private dialogData = inject<FilterModalData>(MAT_DIALOG_DATA);
  private apiService = inject(ApplicationSequenceNumbersApiService);
  private loggingService = inject(LoggingService);

  // UI constants
  readonly UI = UI.SYSTEM_ADMIN.APPLICATION_SEQUENCE_NUMBERS;

  // Cycle options for dropdown (no search - only 2 options)
  readonly cycleOptions = signal(RESET_CYCLE_OPTIONS);

  // Filter option signals (loaded from API)
  readonly chapterIdOptions = signal<string[]>([]);
  readonly chapterNameOptions = signal<string[]>([]);
  readonly numberTypeOptions = signal<string[]>([]);

  // Loading state for filter options
  readonly isLoadingFilters = signal(false);

  // Search form controls for filtering dropdown options
  readonly chapterIdSearchControl = new FormControl('');
  readonly chapterNameSearchControl = new FormControl('');
  readonly numberTypeSearchControl = new FormControl('');

  // Convert FormControl values to signals for reactivity
  readonly chapterIdSearch = signal('');
  readonly chapterNameSearch = signal('');
  readonly numberTypeSearch = signal('');

  constructor() {
    // Subscribe to form control changes and update signals
    this.chapterIdSearchControl.valueChanges.subscribe(value => {
      this.chapterIdSearch.set(value || '');
    });
    this.chapterNameSearchControl.valueChanges.subscribe(value => {
      this.chapterNameSearch.set(value || '');
    });
    this.numberTypeSearchControl.valueChanges.subscribe(value => {
      this.numberTypeSearch.set(value || '');
    });

    // Initialize form with current filter values to preserve user's selection
    if (this.dialogData.currentFilters) {
      // Store initial values for change detection
      this.initialFilters = {
        chapterId: this.dialogData.currentFilters.chapterId,
        chapterName: this.dialogData.currentFilters.chapterName,
        numberType: this.dialogData.currentFilters.numberType,
        cycle: this.dialogData.currentFilters.cycle,
      };

      // Patch form with current filter values
      this.filterForm.patchValue(this.initialFilters);
    }
  }

  ngOnInit(): void {
    this.loadFilterOptions();
  }

  /**
   * Load filter dropdown options from backend API
   * Replaces client-side extraction of DISTINCT values
   */
  private loadFilterOptions(): void {
    this.isLoadingFilters.set(true);

    this.apiService.getFilterDropdownValues().subscribe({
      next: (data: ApplicationSequenceNumberFilterDropdownDto) => {
        this.chapterIdOptions.set(data.chapterIds || []);
        this.chapterNameOptions.set(data.chapterNames || []);
        this.numberTypeOptions.set(data.numberTypes || []);
        // Cycles remain static from RESET_CYCLE_OPTIONS

        this.isLoadingFilters.set(false);
      },
      error: (error) => {
        this.loggingService.error('Error loading filter options', error);
        // Set empty arrays on error - UI still works, just with empty dropdowns
        this.chapterIdOptions.set([]);
        this.chapterNameOptions.set([]);
        this.numberTypeOptions.set([]);
        this.isLoadingFilters.set(false);
      }
    });
  }

  // Filtered Chapter IDs based on search
  readonly filteredChapterIds = computed(() => {
    const search = this.chapterIdSearch().toLowerCase();
    const options = this.chapterIdOptions();

    if (!search) return options;
    return options.filter(id => id.toLowerCase().includes(search));
  });

  // Filtered Chapter Names based on search
  readonly filteredChapterNames = computed(() => {
    const search = this.chapterNameSearch().toLowerCase();
    const options = this.chapterNameOptions();

    if (!search) return options;
    return options.filter(name => name.toLowerCase().includes(search));
  });

  // Filtered Number Types based on search
  readonly filteredNumberTypes = computed(() => {
    const search = this.numberTypeSearch().toLowerCase();
    const options = this.numberTypeOptions();

    if (!search) return options;
    return options.filter(type => type.toLowerCase().includes(search));
  });

  // Filter form - stores codes/values, not display strings
  // Initialize with null so nothing is selected by default
  filterForm = new FormGroup({
    chapterId: new FormControl<string | null>(null),
    chapterName: new FormControl<string | null>(null),
    numberType: new FormControl<string | null>(null),
    cycle: new FormControl<string | null>(null),
  });

  // Store initial filter values to detect changes
  private initialFilters: ApplicationSequenceNumberFilterParams = {
    chapterId: null,
    chapterName: null,
    numberType: null,
    cycle: null
  };

  /**
   * Check if apply button should be disabled
   * Disabled when current values match initial values (no changes made)
   * Enabled when user makes any change from the initial state
   *
   * NOTE: This prevents re-applying the same filters, which is intentional per user requirement:
   * "once you select and apply filter, again you open filter apply button should be disable
   * until user selects different option"
   *
   * This ensures users must make a change to re-apply, preventing accidental duplicate API calls.
   */
  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    // Check if current values differ from initial values
    const hasChanged = formValue.chapterId !== this.initialFilters.chapterId ||
                      formValue.chapterName !== this.initialFilters.chapterName ||
                      formValue.numberType !== this.initialFilters.numberType ||
                      formValue.cycle !== this.initialFilters.cycle;

    // Disable only if no changes made from initial state
    return !hasChanged;
  }

  /**
   * Apply filters and close modal
   * Emits filter values to parent component
   * Note: Empty string "" means "All" selected, null means not selected
   */
  onApply(): void {
    const filters: ApplicationSequenceNumberFilterParams = {
      chapterId: this.filterForm.value.chapterId ?? null,
      chapterName: this.filterForm.value.chapterName ?? null,
      numberType: this.filterForm.value.numberType ?? null,
      cycle: this.filterForm.value.cycle ?? null,
    };

    this.dialogRef.close(filters);
  }

  /**
   * Clear all filters, keep panel open
   * Reset to null (no selection) for each field
   */
  onClearAll(): void {
    this.filterForm.reset({
      chapterId: null,
      chapterName: null,
      numberType: null,
      cycle: null,
    });
  }

  /**
   * Close modal without applying filters
   */
  onClose(): void {
    this.dialogRef.close();
  }
}
