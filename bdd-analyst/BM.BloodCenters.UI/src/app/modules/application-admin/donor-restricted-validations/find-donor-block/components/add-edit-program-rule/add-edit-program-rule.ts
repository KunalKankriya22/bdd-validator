import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, finalize } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { FindDonorBlockService } from '../../services/find-donor-block.service';
import {
  FindDonorBlockModel,
  ProgramIdOption
} from '../../models/find-donor-block.model';

@Component({
  selector: 'app-add-edit-program-rule',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatIconModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './add-edit-program-rule.html',
  styleUrls: ['./add-edit-program-rule.scss']
})
export class AddEditProgramRuleComponent implements OnInit, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: FindDonorBlockModel | null = null;

  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  programRuleForm!: FormGroup;

  // Dropdown options
  programNameOptions: string[] = [];
  gradeLevelOptions: string[] = [];

  // Program ID searchable dropdown
  programIdOptions = signal<ProgramIdOption[]>([]);
  readonly programIdSearchControl = new FormControl('');
  readonly programIdSearch = signal('');
  readonly filteredProgramIds = computed(() => {
    const search = this.programIdSearch().toLowerCase();
    const options = this.programIdOptions();
    if (!search) return options;
    return options.filter(opt =>
      opt.programId.toLowerCase().includes(search) ||
      opt.applId.toLowerCase().includes(search)
    );
  });

  isLoading = false;
  isSaving = false;
  isLoadingDropdowns = false;
  hasError = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private findDonorBlockService: FindDonorBlockService,
    private snackBar: MatSnackBar
  ) {
    this.initializeForm();
    this.programIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.programIdSearch.set(value || '');
      });
  }

  ngOnInit(): void {
    // Load dropdown values
    this.loadDropdownValues();

    // Set up valueChanges subscriptions before populateForm so edit data triggers them
    // When Create New Donor is No, set Grade Level to 0 and disable it
    this.programRuleForm.get('createNewDonor')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const gradeLevelControl = this.programRuleForm.get('gradeLevel');
        if (value === false) {
          gradeLevelControl?.setValue('0');
          gradeLevelControl?.disable();
        } else {
          gradeLevelControl?.enable();
        }
      });

    // When New Allowed is No, disable New Allowed Grade
    this.programRuleForm.get('newAllowed')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const newAllowedGradeControl = this.programRuleForm.get('newAllowedGrade');
        if (value === false) {
          newAllowedGradeControl?.setValue('');
          newAllowedGradeControl?.disable();
        } else {
          newAllowedGradeControl?.enable();
        }
      });

    // When Select Allowed is No, disable Select Allowed Grade and Select Multiple Grade
    this.programRuleForm.get('selectAllowed')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const selectAllowedGradeControl = this.programRuleForm.get('selectAllowedGrade');
        const selectMultipleGradeControl = this.programRuleForm.get('selectMultipleGrade');
        if (value === false) {
          selectAllowedGradeControl?.setValue('');
          selectAllowedGradeControl?.disable();
          selectMultipleGradeControl?.setValue('');
          selectMultipleGradeControl?.disable();
        } else {
          selectAllowedGradeControl?.enable();
          selectMultipleGradeControl?.enable();
        }
      });

    if (this.mode === 'edit' && this.data) {
      this.populateForm(this.data);
      this.programRuleForm.get('programName')?.disable();
    }
  }

  private loadDropdownValues(): void {
    this.isLoadingDropdowns = true;
    this.disableDropdownControls();

    this.findDonorBlockService
      .getDropdownValues()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingDropdowns = false;
          this.enableDropdownControlsByState();
        })
      )
      .subscribe({
        next: (response) => {
          this.programNameOptions = response.programNames;
          this.gradeLevelOptions = response.gradeLevels;
        },
        error: () => {
          // Set default values on error
          this.programNameOptions = [];
          this.gradeLevelOptions = ['0', '1', '2', '3', '4'];
        }
      });

    // Load program IDs for searchable dropdown
    this.findDonorBlockService
      .getProgramIds()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (programIds) => {
          this.programIdOptions.set(programIds);
          if (this.mode === 'edit' && this.data?.programName) {
            setTimeout(() => {
              this.programRuleForm.get('programName')?.setValue(
                this.data!.programName,
                { emitEvent: false }
              );
            });
          }
        },
        error: () => {
          this.programIdOptions.set([]);
        }
      });
  }

  private disableDropdownControls(): void {
    this.programRuleForm.get('programName')?.disable({ emitEvent: false });
    this.programRuleForm.get('gradeLevel')?.disable({ emitEvent: false });
    this.programRuleForm.get('newAllowedGrade')?.disable({ emitEvent: false });
    this.programRuleForm.get('selectAllowedGrade')?.disable({ emitEvent: false });
    this.programRuleForm.get('selectMultipleGrade')?.disable({ emitEvent: false });
  }

  private enableDropdownControlsByState(): void {
    if (this.mode !== 'edit') {
      this.programRuleForm.get('programName')?.enable({ emitEvent: false });
    }

    const createNewDonor = this.programRuleForm.get('createNewDonor')?.value;
    if (createNewDonor !== false) {
      this.programRuleForm.get('gradeLevel')?.enable({ emitEvent: false });
    }

    const newAllowed = this.programRuleForm.get('newAllowed')?.value;
    if (newAllowed !== false) {
      this.programRuleForm.get('newAllowedGrade')?.enable({ emitEvent: false });
    }

    const selectAllowed = this.programRuleForm.get('selectAllowed')?.value;
    if (selectAllowed !== false) {
      this.programRuleForm.get('selectAllowedGrade')?.enable({ emitEvent: false });
      this.programRuleForm.get('selectMultipleGrade')?.enable({ emitEvent: false });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.programRuleForm = this.fb.group({
      programName: [null, [Validators.required, Validators.maxLength(10)]],
      createNewDonor: [null, [Validators.required]],
      gradeLevel: ['', [Validators.required, Validators.maxLength(2)]],
      newAllowed: [null, [Validators.required]],
      newAllowedGrade: [''],
      selectAllowed: [null, [Validators.required]],
      selectAllowedGrade: [''],
      selectMultipleGrade: [''],
      holdAllowed: [null, [Validators.required]],
      flag1: [false],
      flag2: [false],
      flag3: [false],
      flag4: [false]
    });
  }

  private populateForm(data: FindDonorBlockModel): void {
    this.programRuleForm.patchValue({
      programName: data.programName || '',
      createNewDonor: data.createNewDonor || false,
      gradeLevel: data.gradeLevel || '',
      newAllowed: data.newAllowed !== undefined && data.newAllowed !== null ? data.newAllowed : null,
      newAllowedGrade: data.newAllowedGrade || '',
      selectAllowed: data.selectAllowed || false,
      selectAllowedGrade: data.selectAllowedGrade || '',
      selectMultipleGrade: data.selectMultipleGrade || '',
      holdAllowed: data.holdAllowed || false,
      flag1: this.convertToBoolean(data.flag1),
      flag2: this.convertToBoolean(data.flag2),
      flag3: this.convertToBoolean(data.flag3),
      flag4: this.convertToBoolean(data.flag4)
    });

  }

  private convertToBoolean(value: string | boolean | undefined): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim().toUpperCase();
      return trimmed === 'Y' || trimmed === 'YES' || trimmed === 'TRUE' || trimmed === '1';
    }
    return false;
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    if (this.programRuleForm.invalid) {
      this.programRuleForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.hasError = false;

    if (this.mode === 'add') {
      this.performAdd();
    } else {
      this.performUpdate();
    }
  }

  private performAdd(): void {
    const formValue = this.programRuleForm.getRawValue();
    const addPayload = this.findDonorBlockService.mapFormDataToAddDto(formValue);

    this.findDonorBlockService
      .addProgramRule(addPayload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          const programName = formValue.programName || '';

          // Handle API returning 200 with success: false
          if (response?.success === false) {
            const errorResponse = response?.errorResponse;
            const errorMsg = errorResponse
              ? `Error ${errorResponse.errorCode}: ${errorResponse.error}`
              : (response?.message || 'Failed to add program rule.');
            this.snackBar.open(errorMsg, 'DISMISS', {
              duration: 5000,
              horizontalPosition: 'right',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
            return;
          }

          const message = `New Program ${programName} added successfully.`;
          this.snackBar.open(message, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.saveSuccess.emit();
        },
        error: (err) => {
          const errorResponse = err?.error?.errorResponse;
          const message = errorResponse
            ? `Error ${errorResponse.errorCode}: ${errorResponse.error}`
            : 'Failed to add program rule.';
          this.snackBar.open(message, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private performUpdate(): void {
    const formValue = this.programRuleForm.getRawValue();

    const mergedData = {
      ...formValue,
      multipleSelection: this.data?.multipleSelection,
      updateKeyInfo: this.data?.updateKeyInfo,
      enforcePassword: this.data?.enforcePassword
    };

    const updatePayload = this.findDonorBlockService.mapFormDataToUpdateDto(mergedData);
    const programName = this.data?.programName || '';

    this.findDonorBlockService
      .updateProgramRule(programName, updatePayload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          // Handle API returning 200 with success: false
          if (response?.success === false) {
            const errorResponse = response?.errorResponse;
            const errorMsg = errorResponse
              ? `Error ${errorResponse.errorCode}: ${errorResponse.error}`
              : (response?.message || 'Failed to update program rule.');
            this.snackBar.open(errorMsg, 'DISMISS', {
              duration: 5000,
              horizontalPosition: 'right',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
            return;
          }

          let message;
          if (response?.message === 'Program updated successfully.') {
            message = `Program ${programName} updated successfully.`;
          } else {
            message = response?.message || `Program ${programName} updated successfully.`;
          }

          this.snackBar.open(message, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          this.saveSuccess.emit();
        },
        error: (err) => {
          const errorResponse = err?.error?.errorResponse;
          const message = errorResponse
            ? `Error ${errorResponse.errorCode}: ${errorResponse.error}`
            : 'Failed to update program rule.';
          this.snackBar.open(message, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  getFieldError(fieldName: string): string {
    const control = this.programRuleForm.get(fieldName);
    const label = this.getFieldLabel(fieldName);
    if (control?.hasError('required') && control.touched) {
      return `${label} is required`;
    }
    if (control?.hasError('whitespaceOnly') && control.touched) {
      return `${label} cannot contain only spaces`;
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return `Maximum ${maxLength} characters allowed`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const fieldLabels: { [key: string]: string } = {
      programName: 'Program Name',
      gradeLevel: 'Grade Level',
      createNewDonor: 'Create New Donor',
      newAllowed: 'New Allowed',
      newAllowedGrade: 'New Allowed Grade',
      selectAllowed: 'Select Allowed',
      selectAllowedGrade: 'Select Allowed Grade',
      selectMultipleGrade: 'Select Multiple Grade',
      holdAllowed: 'Hold Allowed'
    };
    return fieldLabels[fieldName] || 'This field';
  }

  get isFormValid(): boolean {
    const programName = this.programRuleForm.get('programName');
    if (!programName || programName.invalid || !programName.value) return false;

    const createNewDonor = this.programRuleForm.get('createNewDonor');
    if (createNewDonor?.value === null || createNewDonor?.value === undefined) return false;

    const gradeLevel = this.programRuleForm.get('gradeLevel');
    if (gradeLevel?.enabled && (!gradeLevel.value && gradeLevel.value !== '0')) return false;

    const newAllowed = this.programRuleForm.get('newAllowed');
    if (newAllowed?.value === null || newAllowed?.value === undefined) return false;

    const selectAllowed = this.programRuleForm.get('selectAllowed');
    if (selectAllowed?.value === null || selectAllowed?.value === undefined) return false;

    const holdAllowed = this.programRuleForm.get('holdAllowed');
    if (holdAllowed?.value === null || holdAllowed?.value === undefined) return false;

    return this.programRuleForm.valid;
  }

  get isFormDirty(): boolean {
    return this.mode === 'add' || this.programRuleForm.dirty;
  }

  get panelTitle(): string {
    return this.mode === 'add' ? 'Add New Program Rule' : 'Edit Program Rule';
  }
}
