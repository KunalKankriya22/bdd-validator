import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DonorGradingMatrixService } from '../services/donor-grading-matrix.service';
import moment from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';
import {
  DonorGradingMatrix,
  CreateDonorGradingMatrix,
  UpdateDonorGradingMatrix,
  NAME_MATCH_OPTIONS,
  DOB_MATCH_OPTIONS,
  GENDER_MATCH_OPTIONS,
  GRADE_OPTIONS
} from '../models/donor-grading-matrix.model';

@Component({
  selector: 'app-add-edit-grading-matrix',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './add-edit-grading-matrix.html',
  styleUrls: ['./add-edit-grading-matrix.scss']
})
export class AddEditGradingMatrix implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: DonorGradingMatrix | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  form: FormGroup;
  panelTitle: string = '';
  lastUpdated: string = '';

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

  editModeValues: {
    dgmId: number | null;
  } = {
    dgmId: null
  };

  isSaving = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private donorGradingMatrixService: DonorGradingMatrixService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      lastnameMatch: ['', [Validators.required, Validators.maxLength(5)]],
      firstnameMatch: ['', [Validators.required, Validators.maxLength(5)]],
      dobMatch: ['', [Validators.required, Validators.maxLength(5)]],
      genderMatch: ['', [Validators.required, Validators.maxLength(5)]],
      grade: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.setupPanel();
    this.setupSearchFilters();
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

  private setupSearchFilters(): void {
    // Firstname search filter
    this.firstnameSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredFirstnameOptions = this.nameMatchOptions.filter(option =>
          option.label.toLowerCase().includes(term)
        );
      });

    // Lastname search filter
    this.lastnameSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredLastnameOptions = this.nameMatchOptions.filter(option =>
          option.label.toLowerCase().includes(term)
        );
      });

    // DOB search filter
    this.dobSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredDobOptions = this.dobMatchOptions.filter(option =>
          option.label.toLowerCase().includes(term)
        );
      });

    // Gender search filter
    this.genderSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredGenderOptions = this.genderMatchOptions.filter(option =>
          option.label.toLowerCase().includes(term)
        );
      });

    // Grade search filter
    this.gradeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredGradeOptions = this.gradeOptions.filter(option =>
          option.label.toLowerCase().includes(term)
        );
      });
  }

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add Donor Grading Matrix';
      this.lastUpdated = '';
      this.resetFormForAddMode();
    } else {
      this.panelTitle = 'Edit Matrix';
      this.lastUpdated = '';
      this.populateFormForEdit();
    }
  }

  private resetFormForAddMode(): void {
    this.editModeValues = { dgmId: null };

    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    this.form.get('lastnameMatch')?.setValidators([Validators.required, Validators.maxLength(5)]);
    this.form.get('firstnameMatch')?.setValidators([Validators.required, Validators.maxLength(5)]);
    this.form.get('dobMatch')?.setValidators([Validators.required, Validators.maxLength(5)]);
    this.form.get('genderMatch')?.setValidators([Validators.required, Validators.maxLength(5)]);
    this.form.get('grade')?.setValidators([Validators.required]);

    this.form.get('lastnameMatch')?.updateValueAndValidity();
    this.form.get('firstnameMatch')?.updateValueAndValidity();
    this.form.get('dobMatch')?.updateValueAndValidity();
    this.form.get('genderMatch')?.updateValueAndValidity();
    this.form.get('grade')?.updateValueAndValidity();
  }

  private populateFormForEdit(): void {
    if (this.data) {
      this.editModeValues = {
        dgmId: this.data.dgmId
      };

      this.form.patchValue({
        lastnameMatch: this.data.lastnameMatch,
        firstnameMatch: this.data.firstnameMatch,
        dobMatch: this.data.dobMatch,
        genderMatch: this.data.genderMatch,
        grade: this.data.grade
      });

      this.form.markAsPristine();
      this.form.markAsUntouched();
    }
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();
    this.isSaving = true;

    if (this.mode === 'add') {
      const addPayload: CreateDonorGradingMatrix = {
        lastnameMatch: formValue.lastnameMatch,
        firstnameMatch: formValue.firstnameMatch,
        dobMatch: formValue.dobMatch,
        genderMatch: formValue.genderMatch,
        grade: formValue.grade
      };

      this.donorGradingMatrixService.addDonorGradingMatrix(addPayload)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => { this.isSaving = false; })
        )
        .subscribe({
          next: (response: any) => {
            const message = response?.message || 'Donor grading matrix record created successfully';
            this.snackBar.open(message, 'DISMISS', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
            this.saveSuccess.emit();
            this.closePanel.emit();
          },
          error: (error) => {
          }
        });
    } else {
      const updatePayload: UpdateDonorGradingMatrix = {
        lastnameMatch: formValue.lastnameMatch,
        firstnameMatch: formValue.firstnameMatch,
        dobMatch: formValue.dobMatch,
        genderMatch: formValue.genderMatch,
        grade: formValue.grade
      };

      this.donorGradingMatrixService.updateDonorGradingMatrix(this.editModeValues.dgmId!, updatePayload)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => { this.isSaving = false; })
        )
        .subscribe({
          next: (response: any) => {
            const message = response?.message || 'Donor grading matrix record updated successfully';
            this.snackBar.open(message, 'DISMISS', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
            this.saveSuccess.emit();
            this.closePanel.emit();
          },
          error: (error) => {
          }
        });
    }
  }

  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();
    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: CreateDonorGradingMatrix = {
        lastnameMatch: formValue.lastnameMatch,
        firstnameMatch: formValue.firstnameMatch,
        dobMatch: formValue.dobMatch,
        genderMatch: formValue.genderMatch,
        grade: formValue.grade
      };
      apiCall = this.donorGradingMatrixService.addDonorGradingMatrix(addPayload);
    } else {
      const updatePayload: UpdateDonorGradingMatrix = {
        lastnameMatch: formValue.lastnameMatch,
        firstnameMatch: formValue.firstnameMatch,
        dobMatch: formValue.dobMatch,
        genderMatch: formValue.genderMatch,
        grade: formValue.grade
      };
      apiCall = this.donorGradingMatrixService.updateDonorGradingMatrix(this.editModeValues.dgmId!, updatePayload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isSaving = false; })
      )
      .subscribe({
        next: (response: any) => {
          const message = response?.message || 'Operation completed successfully';
          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          this.saveSuccess.emit();

          if (this.mode === 'edit') {
            this.mode = 'add';
            this.modeChange.emit('add');
            this.resetFormForAddMode();
            this.setupPanel();
          } else {
            this.resetFormForAddMode();
          }
        },
      });
  }

  formatDateTime(date: Date | null): string {
    if (!date) return '';
    const momentDate = moment(date);
    const isToday = momentDate.isSame(moment(), 'day');

    if (isToday) {
      return momentDate.format('[Today], hh:mm A [PST]');
    } else {
      return momentDate.format('DD-MMM-YYYY, hh:mm A [PST]');
    }
  }

  getFieldError(fieldName: string, displayName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return `${displayName} is required`;
    }
    if (control.hasError('maxlength')) {
      return `${displayName} must not exceed 5 characters`;
    }
    return '';
  }

  get isFormActionDisabled(): boolean {
    if (this.mode === 'add') {
      return this.form.invalid || this.isSaving;
    }
    return this.form.invalid || !this.form.dirty || this.isSaving;
  }
}
