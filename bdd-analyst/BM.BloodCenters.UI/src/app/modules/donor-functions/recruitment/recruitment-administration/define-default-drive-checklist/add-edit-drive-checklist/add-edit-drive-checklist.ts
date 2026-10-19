import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil, finalize } from 'rxjs';

import { DefineDefaultDriveChecklistService } from '../services/define-default-drive-checklist.service';
import {
  DefineDefaultDriveChecklistModel,
  DriveChecklistDto,
  UpdateDriveChecklistDto,
  DriveChecklistAddDropdownLov
} from '../models/define-default-drive-checklist.model';

export interface DriveChecklistFormData {
  sortSeq: number;
  actionCode: string;
  actionDescription: string;
  targetDays: number;
  timeFlag: string;
}

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
  selector: 'app-add-edit-drive-checklist',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
    ReactiveFormsModule
  ],
  templateUrl: './add-edit-drive-checklist.html',
  styleUrls: ['./add-edit-drive-checklist.scss']
})
export class AddEditDriveChecklistComponent implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: DefineDefaultDriveChecklistModel | null = null;
  @Input() chapterId: string = ''; // Chapter ID from parent component
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<DriveChecklistFormData>();

  form: FormGroup;
  panelTitle: string = '';
  panelSubtitle: string = '';

  timelineOptions: Array<{key: string, value: string}> = [];
  actionCodeOptions: Array<{key: string, value: string}> = [];
  nextSequence: number | null = null;

  isSaving = false;
  savingAction: 'add' | 'addAnother' | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private driveChecklistService: DefineDefaultDriveChecklistService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      actionCode: ['', [Validators.required]],
      actionDescription: ['', [Validators.required]],
      targetDays: [null, [Validators.required, Validators.min(0), Validators.max(9999), integerValidator]],
      timeFlag: ['', [Validators.required]],
      sortSeq: [null, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadDropdownData();
    this.setupPanel();
    this.setupActionCodeListener();
  }

  /**
   * Setup listener for action code changes to auto-populate description
   */
  private setupActionCodeListener(): void {
    this.form.get('actionCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(actionCode => {
        if (this.mode === 'add' && actionCode) {
          // Find the selected action and populate description
          // API structure: key = display name (description), value = code
          const selectedAction = this.actionCodeOptions.find(opt => opt.value === actionCode);
          if (selectedAction) {
            this.form.patchValue({ actionDescription: selectedAction.key }, { emitEvent: false });
          }
        }
      });
  }

  private loadDropdownData(): void {
    // Load add dropdown data (for action codes, timeline, and next sequence)
    this.driveChecklistService.getDriveChecklistAddDropdowns()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.actionCodeOptions = response.actionCodes || [];
          this.timelineOptions = response.timeline || [];
          this.nextSequence = response.nextSequence ?? null;

          // If in add mode and sequence is available, set it
          if (this.mode === 'add' && this.nextSequence !== null) {
            this.form.patchValue({ sortSeq: this.nextSequence });
          }
        },
        error: (error) => {
          console.error('Error loading dropdown data:', error);
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (!changes['mode']?.firstChange && !changes['data']?.firstChange) {
        this.setupPanel();

        if (this.mode === 'add') {
          this.resetFormForAddMode();
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add New Checklist Item';
      this.panelSubtitle = '';
      this.resetFormForAddMode();
      // Disable sequence field in add mode (auto-generated)
      this.form.get('sortSeq')?.disable();
      if (this.nextSequence !== null) {
        this.form.patchValue({ sortSeq: this.nextSequence });
      }
      // Enable action and description in add mode
      this.form.get('actionCode')?.enable();
      this.form.get('actionDescription')?.enable();
    } else {
      this.panelTitle = 'Edit Checklist Item';
      this.panelSubtitle = this.getLastModifiedText();
      this.populateFormForEdit();
      // In edit mode: only Target Days and Time Flag are editable
      // Disable sequence, action code, and action description fields
      this.form.get('sortSeq')?.disable();
      this.form.get('actionCode')?.disable();
      this.form.get('actionDescription')?.disable();
      // Ensure targetDays and timeFlag are enabled
      this.form.get('targetDays')?.enable();
      this.form.get('timeFlag')?.enable();
    }
  }

  private resetFormForAddMode(): void {
    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    // Restore required validators for add mode (sortSeq not required as it's disabled)
    this.form.get('actionCode')?.setValidators([Validators.required]);
    this.form.get('actionDescription')?.setValidators([Validators.required]);
    this.form.get('targetDays')?.setValidators([Validators.required, Validators.min(0), Validators.max(9999), integerValidator]);
    this.form.get('timeFlag')?.setValidators([Validators.required]);
    this.form.get('sortSeq')?.clearValidators();

    // Update validity
    this.form.get('actionCode')?.updateValueAndValidity();
    this.form.get('actionDescription')?.updateValueAndValidity();
    this.form.get('targetDays')?.updateValueAndValidity();
    this.form.get('timeFlag')?.updateValueAndValidity();
    this.form.get('sortSeq')?.updateValueAndValidity();

    // Set next sequence if available
    if (this.nextSequence !== null) {
      this.form.patchValue({ sortSeq: this.nextSequence });
    }
  }

  private populateFormForEdit(): void {
    if (this.data) {
      this.form.patchValue({
        actionCode: this.data.actionCode || '',
        actionDescription: this.data.actionDescription || '',
        targetDays: this.data.targetDays ?? null,
        timeFlag: this.data.timeFlag || '',
        sortSeq: this.data.sortSeq ?? null
      });
    }
  }

  private getLastModifiedText(): string {
    // TODO: Add lastModifiedDate field to API response if needed
    // For now, return empty string as the field is not available in the model
    return '';
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue(); // Use getRawValue to get disabled fields
    const chapterId = this.data?.chapterId || this.chapterId || '';

    this.isSaving = true;
    this.savingAction = 'add';

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: DriveChecklistDto = {
        actionCode: formValue.actionCode?.trim() || '',
        chapterId: chapterId,
        targetDays: formValue.targetDays,
        timeFlag: formValue.timeFlag
      };

      apiCall = this.driveChecklistService.addDriveChecklist(addPayload);
    } else {
      const updatePayload: UpdateDriveChecklistDto = {
        originalActionCode: this.data?.actionCode || '',
        chapterId: chapterId,
        targetDays: formValue.targetDays,
        timeFlag: formValue.timeFlag || this.data?.timeFlag || ''
      };

      apiCall = this.driveChecklistService.updateDriveChecklist(updatePayload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
          this.savingAction = null;
        })
      )
      .subscribe({
        next: (response: any) => {
          const message = response?.message || (this.mode === 'add'
            ? 'Drive checklist item added successfully'
            : 'Drive checklist item updated successfully');

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: DriveChecklistFormData = {
            sortSeq: formValue.sortSeq,
            actionCode: formValue.actionCode?.trim() || '',
            actionDescription: formValue.actionDescription?.trim() || '',
            targetDays: formValue.targetDays,
            timeFlag: formValue.timeFlag
          };

          this.saveSuccess.emit(result);
          this.closePanel.emit();
        }
        // Error handling is done globally by authInterceptor
      });
  }

  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue(); // Use getRawValue to get disabled fields
    const chapterId = this.data?.chapterId || this.chapterId || '';

    this.isSaving = true;
    this.savingAction = 'addAnother';

    const addPayload: DriveChecklistDto = {
      actionCode: formValue.actionCode?.trim() || '',
      chapterId: chapterId,
      targetDays: formValue.targetDays,
      timeFlag: formValue.timeFlag
    };

    this.driveChecklistService.addDriveChecklist(addPayload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
          this.savingAction = null;
        })
      )
      .subscribe({
        next: (response: any) => {
          const message = response?.message || 'Drive checklist item added successfully';

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: DriveChecklistFormData = {
            sortSeq: formValue.sortSeq,
            actionCode: formValue.actionCode?.trim() || '',
            actionDescription: formValue.actionDescription?.trim() || '',
            targetDays: formValue.targetDays,
            timeFlag: formValue.timeFlag
          };

          this.saveSuccess.emit(result);

          // Reload dropdown data for next sequence
          this.loadDropdownData();

          // Reset form for another entry
          this.resetFormForAddMode();
        }
        // Error handling is done globally by authInterceptor
      });
  }


  get actionCodeControl() {
    return this.form.get('actionCode');
  }

  get actionDescriptionControl() {
    return this.form.get('actionDescription');
  }

  get targetDaysControl() {
    return this.form.get('targetDays');
  }

  get timeFlagControl() {
    return this.form.get('timeFlag');
  }

  get sortSeqControl() {
    return this.form.get('sortSeq');
  }

  getActionError(): string {
    const control = this.actionCodeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Action is required';
    }
    return '';
  }

  getDescriptionError(): string {
    const control = this.actionDescriptionControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Description is required';
    }
    return '';
  }

  getNoOfDaysError(): string {
    const control = this.targetDaysControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'No. of Days is required';
    }
    if (control.hasError('notInteger')) {
      return 'No. of Days must be a whole number';
    }
    if (control.hasError('min')) {
      return 'No. of Days must be 0 or greater';
    }
    if (control.hasError('max')) {
      return 'No. of Days must be 9999 or less';
    }
    return '';
  }

  getTimelineError(): string {
    const control = this.timeFlagControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Timeline is required';
    }
    return '';
  }

  getSequenceError(): string {
    const control = this.sortSeqControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Sequence is required';
    }
    if (control.hasError('min')) {
      return 'Sequence must be at least 1';
    }
    return '';
  }

  get isFormValid(): boolean {
    // In edit mode, form must be dirty (changed) in addition to being valid
    if (this.mode === 'edit') {
      return this.form.valid && this.form.dirty;
    }
    return this.form.valid;
  }
}
