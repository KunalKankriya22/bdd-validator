import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { DriveChecklistFilterValue } from '../models/define-default-drive-checklist.model';
import { DefineDefaultDriveChecklistService } from '../services/define-default-drive-checklist.service';

// Custom validator for integer only
function integerValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (!Number.isInteger(Number(value))) {
    return { notInteger: true };
  }
  return null;
}

@Component({
  selector: 'app-drive-checklist-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './drive-checklist-filter-panel.html',
  styleUrls: ['./drive-checklist-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriveChecklistFilterPanel implements OnInit {
  @Input() currentFilters: DriveChecklistFilterValue | null = null;
  @Output() apply = new EventEmitter<DriveChecklistFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  conditionOptions: Array<{value: string, label: string}> = [
    { value: 'GE', label: '≥' },
    { value: 'LE', label: '≤' },
    { value: 'EQ', label: '=' }
  ];

  timelineOptions: Array<{key: string, value: string}> = [];

  isLoadingFilters = false;

  constructor(
    private fb: FormBuilder,
    private driveChecklistService: DefineDefaultDriveChecklistService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Parse timeline from comma-separated string to array for multi-select
    const timelineArray = this.currentFilters?.timeline
      ? this.currentFilters.timeline.split(',').map(t => t.trim())
      : [];

    this.filterForm = this.fb.group({
      condition: [this.currentFilters?.condition ?? null],
      noOfDays: [this.currentFilters?.noOfDays ?? null, [Validators.min(0), Validators.max(9999), integerValidator]],
      timeline: [timelineArray]
    });

    this.loadFilterOptions();
  }

  /**
   * Load filter options from backend API
   */
  private loadFilterOptions(): void {
    this.isLoadingFilters = true;

    this.driveChecklistService.getDriveChecklistFilters().subscribe({
      next: (response) => {
        // API returns DriveChecklistFilterLov with timeline array
        if (response && response.timeline) {
          this.timelineOptions = response.timeline;
        }

        this.isLoadingFilters = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading filter options:', error);
        this.isLoadingFilters = false;
        this.cdr.markForCheck();
      }
    });
  }

  onApply(): void {
    const formValue = this.filterForm.value;

    // Convert timeline array to comma-separated string
    const timelineString = formValue.timeline && formValue.timeline.length > 0
      ? formValue.timeline.join(',')
      : null;

    // Check if noOfDays is provided (not null, undefined, or empty string)
    const noOfDaysValue = formValue.noOfDays !== null &&
                          formValue.noOfDays !== undefined &&
                          formValue.noOfDays !== ''
      ? formValue.noOfDays
      : null;

    // Condition is required when noOfDays is provided (enforced by isApplyDisabled)
    const conditionValue = noOfDaysValue !== null
      ? formValue.condition
      : null;

    const filters: DriveChecklistFilterValue = {
      condition: conditionValue,
      noOfDays: noOfDaysValue,
      timeline: timelineString
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset();
    // Emit empty filters to clear the chips
    const emptyFilters: DriveChecklistFilterValue = {
      condition: null,
      noOfDays: null,
      timeline: null
    };
    this.apply.emit(emptyFilters);
  }

  onClose(): void {
    this.close.emit();
  }

  /**
   * Check if Apply button should be disabled
   * Returns true if no filter field has a value, form is invalid,
   * or noOfDays is provided without condition
   */
  get isApplyDisabled(): boolean {
    const formValue = this.filterForm?.value;
    if (!formValue) return true;

    // Disable if form has validation errors
    if (this.filterForm?.invalid) return true;

    const hasCondition = formValue.condition !== null && formValue.condition !== undefined;
    const hasNoOfDays = formValue.noOfDays !== null &&
                        formValue.noOfDays !== undefined &&
                        formValue.noOfDays !== '';
    const hasTimeline = formValue.timeline && formValue.timeline.length > 0;

    // If noOfDays is provided, condition must also be selected
    if (hasNoOfDays && !hasCondition) return true;

    return !hasNoOfDays && !hasTimeline;
  }

  /**
   * Check if Clear button should be disabled
   * Returns true if no filter field has a value
   */
  get isClearDisabled(): boolean {
    const formValue = this.filterForm?.value;
    if (!formValue) return true;

    const hasCondition = formValue.condition !== null && formValue.condition !== undefined;
    const hasNoOfDays = formValue.noOfDays !== null &&
                        formValue.noOfDays !== undefined &&
                        formValue.noOfDays !== '';
    const hasTimeline = formValue.timeline && formValue.timeline.length > 0;

    return !hasCondition && !hasNoOfDays && !hasTimeline;
  }

  /**
   * Get error message for No. of Days field
   */
  getNoOfDaysError(): string {
    const control = this.filterForm?.get('noOfDays');
    if (!control || !control.touched) return '';

    if (control.hasError('notInteger')) {
      return 'Must be a whole number';
    }
    if (control.hasError('min')) {
      return 'Must be 0 or greater';
    }
    if (control.hasError('max')) {
      return 'Must be 9999 or less';
    }
    return '';
  }
}
