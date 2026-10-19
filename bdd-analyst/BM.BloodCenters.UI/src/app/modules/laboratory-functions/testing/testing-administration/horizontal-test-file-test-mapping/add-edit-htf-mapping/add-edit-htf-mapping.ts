import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SnackbarService } from '@shared/services/snackbar.service';
import { integerValidator } from '@shared/validators/input.validators';
import { Subject, takeUntil, finalize } from 'rxjs';

import { HtfMappingService } from '../services/htf-mapping.service';
import {
  HtfMappingDto,
  CreateHtfMappingDto,
  UpdateHtfMappingDto,
  TestIdDropdownDto
} from '../models/htf-mapping.model';

@Component({
  selector: 'app-add-edit-htf-mapping',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './add-edit-htf-mapping.html',
  styleUrls: ['./add-edit-htf-mapping.scss']
})
export class AddEditHtfMapping implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: HtfMappingDto | null = null;
  @Input() totalRecords = 0;
  @Input() existingMappings: HtfMappingDto[] = [];
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  form!: FormGroup;
  panelTitle = '';
  sequenceDisplay = '';
  isSaving = false;
  private nextSequence = 0;

  testIdOptions: TestIdDropdownDto[] = [];
  testIdSearchControl = new FormControl('');
  filteredTestIdOptions: TestIdDropdownDto[] = [];

  editModeValues = {
    headerName: ''
  };

  headerNameErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      return !!(control.touched || control.dirty) && this.form?.hasError('duplicateTestId');
    }
  };

  startPosErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const isTouchedOrDirty = !!(control.touched || control.dirty);
      return isTouchedOrDirty && (
        (this.form?.hasError('startNotLessThanEnd') && this.lastChangedPositionField === 'startPos') ||
        !!this.form?.hasError('positionOverlap')
      );
    }
  };

  endPosErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const isTouchedOrDirty = !!(control.touched || control.dirty);
      return isTouchedOrDirty && (
        (this.form?.hasError('startNotLessThanEnd') && this.lastChangedPositionField === 'endPos') ||
        !!this.form?.hasError('positionOverlap')
      );
    }
  };

  private lastChangedPositionField: 'startPos' | 'endPos' | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private htfService: HtfMappingService,
    private snackbarService: SnackbarService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      headerName: ['', [Validators.required]],
      startPos: [null, [Validators.required, integerValidator()]],
      endPos: [null, [Validators.required, integerValidator()]]
    }, {
      validators: [
        this.startLessThanEndValidator,
        (group: AbstractControl) => this.duplicateTestIdValidator(group),
        (group: AbstractControl) => this.positionOverlapValidator(group)
      ]
    });
  }

  ngOnInit(): void {
    this.setupPanel();
    this.loadTestIdOptions();
    this.setupTestIdSearch();
    this.setupPositionCrossValidation();
  }

  private startLessThanEndValidator(group: AbstractControl): ValidationErrors | null {
    const startPos = group.get('startPos')?.value;
    const endPos = group.get('endPos')?.value;

    if (startPos == null || endPos == null || startPos === '' || endPos === '') {
      return null;
    }

    const start = Number(startPos);
    const end = Number(endPos);

    if (isNaN(start) || isNaN(end)) {
      return null;
    }

    return start >= end ? { startNotLessThanEnd: true } : null;
  }

  private duplicateTestIdValidator(group: AbstractControl): ValidationErrors | null {
    const headerName = group.get('headerName')?.value;
    if (!headerName || !this.existingMappings?.length) return null;

    const isDuplicate = this.existingMappings.some(m => {
      if (this.mode === 'edit' && this.data && m.sequenceNo === this.data.sequenceNo) return false;
      return m.headerName === headerName;
    });

    return isDuplicate ? { duplicateTestId: true } : null;
  }

  private positionOverlapValidator(group: AbstractControl): ValidationErrors | null {
    const startPos = group.get('startPos')?.value;
    const endPos = group.get('endPos')?.value;

    if (startPos == null || endPos == null || startPos === '' || endPos === '') return null;

    const start = Number(startPos);
    const end = Number(endPos);
    if (isNaN(start) || isNaN(end)) return null;

    const hasOverlap = this.existingMappings?.some(m => {
      if (this.mode === 'edit' && this.data && m.sequenceNo === this.data.sequenceNo) return false;
      return (start >= m.startPos && start <= m.endPos) ||
             (end >= m.startPos && end <= m.endPos) ||
             (start <= m.startPos && end >= m.endPos);
    });

    return hasOverlap ? { positionOverlap: true } : null;
  }

  private setupPositionCrossValidation(): void {
    this.form.get('startPos')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedPositionField = 'startPos';
        this.form.get('endPos')?.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    this.form.get('endPos')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedPositionField = 'endPos';
        this.form.get('startPos')?.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (!changes['mode']?.firstChange && !changes['data']?.firstChange) {
        this.setupPanel();
      }
    }

    if (changes['existingMappings'] && !changes['existingMappings'].firstChange) {
      this.form.updateValueAndValidity();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPanel(): void {
    this.loadTestIdOptions();

    if (this.mode === 'add') {
      this.panelTitle = 'Add New Test';
      this.loadNextSequenceNo();
      this.resetFormForAddMode();
    } else {
      this.panelTitle = 'Edit Test Mapping';
      this.populateFormForEdit();
    }
  }

  private loadNextSequenceNo(): void {
    this.htfService.getNextSequenceNo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (seqNo) => {
          this.nextSequence = seqNo;
          this.sequenceDisplay = String(this.nextSequence);
        },
        error: () => {
          this.nextSequence = this.totalRecords + 1;
          this.sequenceDisplay = String(this.nextSequence);
        }
      });
  }

  private resetFormForAddMode(): void {
    this.editModeValues = { headerName: '' };
    this.lastChangedPositionField = null;
    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();
  }

  private populateFormForEdit(): void {
    if (!this.data) return;

    this.sequenceDisplay = String(this.data.sequenceNo);
    this.editModeValues.headerName = this.data.headerName;

    this.form.patchValue({
      headerName: this.data.headerName,
      startPos: this.data.startPos,
      endPos: this.data.endPos
    });

    this.form.markAsUntouched();
    this.form.markAsPristine();
  }

  private loadTestIdOptions(): void {
    this.htfService.getTestIdsDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.testIdOptions = options || [];
          this.filteredTestIdOptions = this.testIdOptions;
        },
        error: () => {
          this.testIdOptions = [];
          this.filteredTestIdOptions = [];
        }
      });
  }

  private setupTestIdSearch(): void {
    this.testIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        if (!this.testIdOptions?.length || !search) {
          this.filteredTestIdOptions = this.testIdOptions || [];
          return;
        }
        const lower = search.toLowerCase();
        this.filteredTestIdOptions = this.testIdOptions.filter(
          (t) =>
            (t?.testId || '').toLowerCase().includes(lower) ||
            (t?.testDesc || '').toLowerCase().includes(lower)
        );
      });
  }

  onTestIdDropdownClosed(): void {
    this.testIdSearchControl.setValue('');
    this.filteredTestIdOptions = this.testIdOptions || [];
  }

  private validatePositionFields(): boolean {
    const startControl = this.form.get('startPos');
    const endControl = this.form.get('endPos');
    const startVal = startControl?.value?.toString().trim();
    const endVal = endControl?.value?.toString().trim();

    if (startVal === '-') {
      startControl?.setErrors({ integer: true });
    }
    if (endVal === '-') {
      endControl?.setErrors({ integer: true });
    }

    return !startControl?.errors && !endControl?.errors;
  }

  onSave(): void {
    this.form.markAllAsTouched();
    this.validatePositionFields();

    if (this.form.hasError('startNotLessThanEnd') && !this.lastChangedPositionField) {
      this.lastChangedPositionField = 'startPos';
      this.cdr.markForCheck();
    }

    if (this.form.invalid) return;

    this.isSaving = true;
    const formValue = this.form.getRawValue();

    if (this.mode === 'add') {
      const dto: CreateHtfMappingDto = {
        sequenceNo: Number(this.sequenceDisplay),
        headerName: formValue.headerName,
        startPos: formValue.startPos,
        endPos: formValue.endPos
      };

      this.htfService.create(dto)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isSaving = false)
        )
        .subscribe({
          next: () => {
            this.snackbarService.showSuccess(`New test ${dto.headerName} added successfully.`);
            this.saveSuccess.emit();
            this.closePanel.emit();
          },
          error: () => {
            // Handled by global error interceptor
          }
        });
    } else {
      const dto: UpdateHtfMappingDto = {
        headerName: formValue.headerName,
        startPos: formValue.startPos,
        endPos: formValue.endPos
      };

      this.htfService.update(this.data!.sequenceNo, dto)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isSaving = false)
        )
        .subscribe({
          next: () => {
            this.snackbarService.showSuccess(`Test mapping updated successfully.`);
            this.saveSuccess.emit();
            this.closePanel.emit();
          },
          error: () => {
            // Handled by global error interceptor
          }
        });
    }
  }

  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();
    this.validatePositionFields();

    if (this.form.hasError('startNotLessThanEnd') && !this.lastChangedPositionField) {
      this.lastChangedPositionField = 'startPos';
      this.cdr.markForCheck();
    }

    if (this.form.invalid) return;

    this.isSaving = true;
    const formValue = this.form.getRawValue();

    const dto: CreateHtfMappingDto = {
      sequenceNo: Number(this.sequenceDisplay),
      headerName: formValue.headerName,
      startPos: formValue.startPos,
      endPos: formValue.endPos
    };

    this.htfService.create(dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSaving = false)
      )
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess(`New test ${dto.headerName} added successfully.`);
          this.saveSuccess.emit();
          this.loadNextSequenceNo();
          this.resetFormForAddMode();
        },
        error: () => {
          // Handled by global error interceptor
        }
      });
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onlyNumbersWithMinus(event: KeyboardEvent): void {
    const key = event.key;
    if (key !== '-' && (key < '0' || key > '9')) {
      event.preventDefault();
    }
  }

  onPasteNumbersWithMinus(event: ClipboardEvent): void {
    const pastedData = event.clipboardData?.getData('text') || '';
    if (!/^-?\d+$/.test(pastedData)) {
      event.preventDefault();
    }
  }

  getHeaderNameError(): string {
    const control = this.form.get('headerName');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Test ID is required';
    if (this.form.hasError('duplicateTestId')) return 'This Test ID is already mapped';
    return '';
  }

  getStartPosError(): string {
    const control = this.form.get('startPos');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('required')) return 'Start Position is required';
    if (control.hasError('integer')) return 'Start Position is invalid';
    if (this.form.hasError('startNotLessThanEnd') && this.lastChangedPositionField === 'startPos') {
      return 'Start Position must be less than End Position';
    }
    if (this.form.hasError('positionOverlap')) return 'Position range overlaps with an existing mapping';
    return '';
  }

  getEndPosError(): string {
    const control = this.form.get('endPos');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('required')) return 'End Position is required';
    if (control.hasError('integer')) return 'End Position is invalid';
    if (this.form.hasError('startNotLessThanEnd') && this.lastChangedPositionField === 'endPos') {
      return 'End Position must be greater than Start Position';
    }
    if (this.form.hasError('positionOverlap')) return 'Position range overlaps with an existing mapping';
    return '';
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }
}
