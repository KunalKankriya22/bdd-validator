import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { noWhitespaceOnlyValidator } from '@shared/validators/input.validators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { Subject, takeUntil } from 'rxjs';

import {
  MobilePcLaptopRegisterModel,
  MobilePcLaptopRegisterDto,
  UpdateMobilePcLaptopRegisterDto,
  ChapterLookup
} from '../models/mobile-pc-laptop-register.model';
import { MobilePcLaptopRegisterService } from '../services/mobile-pc-laptop-register.service';
import { SnackbarService } from '@shared/services/snackbar.service';

const DATE_FORMATS = {
  parse: {
    dateInput: 'DD-MMM-YYYY',
  },
  display: {
    dateInput: 'DD-MMM-YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD-MMM-YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-add-edit-mobile-pc-laptop-register',
  standalone: true,
  imports: [
    CommonModule,
    A11yModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    MatDatepickerModule,
    MatProgressSpinnerModule
  ],
  providers: [provideMomentDateAdapter(DATE_FORMATS)],
  templateUrl: './add-edit-mobile-pc-laptop-register.html',
  styleUrls: ['./add-edit-mobile-pc-laptop-register.scss']
})
export class AddEditMobilePcLaptopRegister implements OnInit, OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() record: MobilePcLaptopRegisterModel | null = null;
  @Input() chapters: ChapterLookup[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  form!: FormGroup;
  filteredChapters: ChapterLookup[] = [];
  chapterSearchControl = new FormControl('');
  isLoading = false;
  isSaving = false;

  // Patterns for stripping disallowed characters (used in template)
  laptopIdPattern = /[^a-zA-Z0-9_-]/g;
  tempIdPattern = /[^a-zA-Z0-9]/g;

  // Tracks whether the period key was physically pressed by the user
  private periodKeyPressed = false;
  // Stores the control value captured on keydown (before the keystroke modifies it)
  private valueBeforeInput: Record<string, string> = {};
  isFormDirty = false;
  private initialFormSnapshot = '';
  private originalLaptopId = '';   // Store original laptopId for edit mode
  private originalChapterId = '';  // Store original chapterId for edit mode

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private mobilePcLaptopRegisterService: MobilePcLaptopRegisterService,
    private snackbarService: SnackbarService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.filteredChapters = [...this.chapters];
    this.setupChapterSearch();
    // Populate form if record is already set (for edit mode)
    if (this.mode === 'edit' && this.record) {
      this.populateForm();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chapters']) {
      this.filteredChapters = [...this.chapters];
    }

    if (changes['isOpen'] && this.isOpen) {
      if (this.mode === 'edit' && this.record) {
        // First store original values, then populate form
        this.originalLaptopId = this.record.laptopId || '';
        this.originalChapterId = this.record.chapterId || '';
        this.populateForm();
      } else {
        this.resetForm();
      }
    }

    if (changes['record'] && this.record && this.mode === 'edit') {
      this.originalLaptopId = this.record.laptopId || '';
      this.originalChapterId = this.record.chapterId || '';
      this.populateForm();
    }

    if (changes['mode'] && this.mode === 'add') {
      this.resetForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      chapterId: ['', Validators.required],
      newLaptopId: ['', [Validators.required, Validators.maxLength(6), Validators.pattern(/^[a-zA-Z0-9_-]*$/), noWhitespaceOnlyValidator()]],
      temporaryId: ['', [Validators.required, Validators.maxLength(2), Validators.pattern(/^[A-Z0-9]*$/), noWhitespaceOnlyValidator()]],
      auditIncrement: [null, [Validators.required, Validators.min(0), Validators.maxLength(10), Validators.pattern(/^\d*$/)]],
      location: ['', [Validators.required, Validators.maxLength(200), noWhitespaceOnlyValidator()]],
      detail1: ['', [Validators.maxLength(500), noWhitespaceOnlyValidator()]],
      detail2: ['', [Validators.maxLength(500), noWhitespaceOnlyValidator()]],
      detail3: ['', [Validators.maxLength(500), noWhitespaceOnlyValidator()]],
      detail4: ['', [Validators.maxLength(500), noWhitespaceOnlyValidator()]]
    });

    // Track form changes by comparing with initial snapshot
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isFormDirty = this.getFormSnapshot() !== this.initialFormSnapshot;
      });
  }

  private getFormSnapshot(): string {
    const v = this.form.value;
    return JSON.stringify({
      chapterId: v.chapterId || '',
      newLaptopId: v.newLaptopId?.trim() || '',
      temporaryId: v.temporaryId?.trim() || '',
      auditIncrement: v.auditIncrement ?? null,
      location: v.location?.trim() || '',
      detail1: v.detail1?.trim() || '',
      detail2: v.detail2?.trim() || '',
      detail3: v.detail3?.trim() || '',
      detail4: v.detail4?.trim() || ''
    });
  }

  private setupChapterSearch(): void {
    this.chapterSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredChapters = this.chapters.filter(ch =>
          ch.chapterId.toLowerCase().includes(term) ||
          ch.chapterName.toLowerCase().includes(term)
        );
      });
  }

  private populateForm(): void {
    if (!this.record || !this.form) return;

    // Store original values for PUT request
    this.originalLaptopId = this.record.laptopId || '';
    this.originalChapterId = this.record.chapterId || '';

    this.form.patchValue({
      chapterId: this.record.chapterId || '',
      newLaptopId: this.record.laptopId || '',
      temporaryId: this.record.temporaryId || '',
      auditIncrement: this.record.auditIncrement,
      location: this.record.location || '',
      detail1: this.record.detail1 || '',
      detail2: this.record.detail2 || '',
      detail3: this.record.detail3 || '',
      detail4: this.record.detail4 || ''
    });
    this.initialFormSnapshot = this.getFormSnapshot();
    this.isFormDirty = false;
  }

  private resetForm(): void {
    if (this.form) {
      this.form.reset({
        chapterId: '',
        newLaptopId: '',
        temporaryId: '',
        auditIncrement: null,
        location: '',
        detail1: '',
        detail2: '',
        detail3: '',
        detail4: ''
      });
      this.form.markAsPristine();
      this.form.markAsUntouched();
    }
    this.initialFormSnapshot = this.getFormSnapshot();
    this.isFormDirty = false;
    this.originalLaptopId = '';
    this.originalChapterId = '';
  }

  get panelTitle(): string {
    return this.mode === 'add' ? 'Register New Devices' : 'Edit Registered Device';
  }

  onClose(): void {
    this.resetForm();
    this.close.emit();
  }

  private buildAddDto(): MobilePcLaptopRegisterDto {
    const formValue = this.form.value;
    return {
      laptopId: formValue.newLaptopId ?? '',
      ltTempId: formValue.temporaryId ?? '',
      chapterId: formValue.chapterId ?? '',
      currentSeq: 0,
      incrementBy: formValue.auditIncrement ?? null,
      refreshDate: '',
      location: formValue.location ?? '',
      detail1: formValue.detail1 ?? '',
      detail2: formValue.detail2 ?? '',
      detail3: formValue.detail3 ?? '',
      detail4: formValue.detail4 ?? ''
    };
  }

  private buildUpdateDto(): UpdateMobilePcLaptopRegisterDto {
    const formValue = this.form.value;
    
    return {
      OldLaptopId: this.originalLaptopId,
      OldChapterId: this.originalChapterId,
      newLaptopId: formValue.newLaptopId,
      ltTempId: formValue.temporaryId ?? '',
      chapterId: formValue.chapterId ?? this.originalChapterId,
      currentSeq: this.record?.currentSequence ?? 0,
      incrementBy: formValue.auditIncrement ?? null,
      refreshDate: this.record?.refreshDate ? new Date(this.record.refreshDate).toISOString() : '',
      location: formValue.location ?? '',
      detail1: formValue.detail1 ?? '',
      detail2: formValue.detail2 ?? '',
      detail3: formValue.detail3 ?? '',
      detail4: formValue.detail4 ?? ''
    };
  }

  onSave(): void {
    if (this.mode === 'add' && this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.mode === 'edit') {
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
      }
    }

    this.isSaving = true;

    if (this.mode === 'add') {
      const dto = this.buildAddDto();
      this.mobilePcLaptopRegisterService.addMobilePcLaptopRegister(dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.isSaving = false;
            this.snackbarService.showSuccess(res?.message || 'Record added successfully.');
            this.saveSuccess.emit();
            this.onClose();
          },
          error: (error: any) => {
            this.isSaving = false;
            this.showErrorSnackbar(error, 'add');
          }
        });
    } else {
      const dto = this.buildUpdateDto();
      this.mobilePcLaptopRegisterService.updateMobilePcLaptopRegister(dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.isSaving = false;
            this.snackbarService.showSuccess(res?.message || 'Record updated successfully.');
            this.saveSuccess.emit();
            this.onClose();
          },
          error: (error: any) => {
            this.isSaving = false;
            this.showErrorSnackbar(error, 'update');
          }
        });
    }
  }

  onSaveAndAddAnother(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    const dto = this.buildAddDto();

    this.mobilePcLaptopRegisterService.addMobilePcLaptopRegister(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isSaving = false;
          this.snackbarService.showSuccess(res?.message || 'Record added successfully.');
          this.saveSuccess.emit();
          this.resetForm();
        },
        error: (error: any) => {
          this.isSaving = false;
          this.showErrorSnackbar(error, 'add');
        }
      });
  }

  switchToAddMode(): void {
    this.modeChange.emit('add');
  }

  // Mobile Server ID: A-Z, a-z, 0-9, hyphen, underscore
  onLaptopIdKeyDown(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;
    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) return;
    if (!/^[a-zA-Z0-9_-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onLaptopIdPaste(event: ClipboardEvent): void {
    const pastedData = event.clipboardData?.getData('text') || '';
    if (!/^[a-zA-Z0-9_-]+$/.test(pastedData)) {
      event.preventDefault();
    }
  }

  // Temporary ID: A-Z, 0-9 only (uppercase)
  onTempIdKeyDown(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;
    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) return;
    if (!/^[a-zA-Z0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onTempIdPaste(event: ClipboardEvent): void {
    const pastedData = event.clipboardData?.getData('text') || '';
    if (!/^[a-zA-Z0-9]+$/.test(pastedData)) {
      event.preventDefault();
    }
  }

  /**
   * Captures the control value BEFORE the keystroke modifies it,
   * and tracks whether the period key was physically pressed.
   * Must be bound as (keydown) on every text input that calls sanitizeInput.
   */
  onTextKeyDown(event: KeyboardEvent, controlName: string): void {
    if (event.key === '.') {
      this.periodKeyPressed = true;
    }
    const control = this.form.get(controlName);
    if (control && typeof control.value === 'string') {
      this.valueBeforeInput[controlName] = control.value;
    }
  }

  sanitizeInput(controlName: string): void {
    const control = this.form.get(controlName);
    if (!control) return;
    const value = control.value;
    if (typeof value !== 'string') return;

    let sanitized = value;

    // Detect macOS double-space period: a new period appeared without the user pressing '.'
    const prev = this.valueBeforeInput[controlName];
    if (prev !== undefined && !this.periodKeyPressed) {
      const prevPeriodCount = (prev.match(/\./g) || []).length;
      const currPeriodCount = (value.match(/\./g) || []).length;

      if (currPeriodCount > prevPeriodCount) {
        // Remove only the newly inserted period (the last one)
        const lastDotIndex = sanitized.lastIndexOf('.');
        if (lastDotIndex !== -1) {
          sanitized = sanitized.substring(0, lastDotIndex) + sanitized.substring(lastDotIndex + 1);
        }
      }
    }
    this.periodKeyPressed = false;

    // Remove leading spaces and collapse multiple spaces
    sanitized = sanitized.replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
    if (sanitized !== value) {
      control.setValue(sanitized, { emitEvent: false });
    }
  }

  /**
   * Strips characters not matching the allowed pattern from a field value.
   * Used on (input) to catch OS-level text substitutions (e.g. macOS double-space → period).
   */
  stripDisallowed(controlName: string, allowedPattern: RegExp): void {
    const control = this.form.get(controlName);
    if (!control) return;
    const value = control.value;
    if (typeof value !== 'string') return;

    const stripped = value.replace(allowedPattern, '');
    if (stripped !== value) {
      control.setValue(stripped, { emitEvent: false });
    }
  }

  toUpperCase(controlName: string): void {
    const control = this.form.get(controlName);
    if (!control) return;
    const value = control.value;
    if (typeof value !== 'string') return;

    const upper = value.toUpperCase();
    if (upper !== value) {
      control.setValue(upper, { emitEvent: false });
    }
  }

  trimInput(controlName: string): void {
    const control = this.form.get(controlName);
    if (!control) return;
    const value = control.value;
    if (typeof value !== 'string') return;

    const trimmed = value.trimEnd();
    if (trimmed !== value) {
      control.setValue(trimmed, { emitEvent: false });
    }
  }

  onNumericKeyDown(event: KeyboardEvent): void {
    // Allow: backspace, delete, tab, escape, enter, arrow keys
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;

    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) return;

    // Block if not a digit
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onNumericPaste(event: ClipboardEvent): void {
    const pastedData = event.clipboardData?.getData('text') || '';
    if (!/^\d+$/.test(pastedData)) {
      event.preventDefault();
    }
  }

  hasUnsavedChanges(): boolean {
    return this.form?.dirty ?? false;
  }

  private showErrorSnackbar(error: any, mode: string): void {
    // Check multiple possible error message paths in the response
    let message = error?.error?.errorResponse?.error
               || error?.error?.message
               || error?.message;

    // If no error message found, provide specific messages based on status code
    if (!message) {
      if (error?.status === 400 || error?.error?.statusCode === 400) {
        message = 'Invalid request. Please check your input.';
      } else if (error?.status === 409 || error?.error?.statusCode === 409) {
        message = 'Duplicate record already exists.';
      } else {
        message = `Failed to ${mode} record. Please try again.`;
      }
    }

    // Extract error code and prepend to message if available
    const errorCode = error?.error?.errorCode || error?.error?.errorResponse?.errorCode;
    if (errorCode) {
      message = `Error ${errorCode}: ${message}`;
    }

    this.snackbarService.showError(message, 'DISMISS');
  }
}
