import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, inject, signal, computed, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { noWhitespaceOnlyValidator, codeFieldValidator } from '@shared/validators/input.validators';
import { VALIDATION_SYSTEM_ADMINISTRATION } from '../../../../core/constants/validation.constants';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import moment from 'moment';
import { TranslateModule } from '@ngx-translate/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ApplicationSequenceNumber,ChapterLookup } from '../interfaces/application-sequence-number.interface';
import { RESET_CYCLE_OPTIONS } from '../models/reset-cycle.enum';
import { ChapterLookupService } from '../services/chapter-lookup.service';
import { ApplicationSequenceNumbersApiService } from '../services/application-sequence-numbers-api.service';


export type PanelMode = 'add' | 'edit';

@Component({
  selector: 'app-sequence-form-panel',
  standalone: true,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    TranslateModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './sequence-form-panel.component.html',
  styleUrl: './sequence-form-panel.component.scss',
})
export class SequenceFormPanelComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private chapterService = inject(ChapterLookupService);
  private apiService = inject(ApplicationSequenceNumbersApiService);
  private snackBar = inject(MatSnackBar);

  @Input() data: ApplicationSequenceNumber | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<ApplicationSequenceNumber>();

  // Add 'open' class to host element
  @HostBinding('class.open') isOpen = true;

  // Signals
  modeSignal = signal<PanelMode>('add');
  isSubmitting = signal(false);
  chapters = signal<ChapterLookup[]>([]);
  filteredChapters = signal<ChapterLookup[]>([]);
  selectedChapterName = signal<string>('');

  // Keep @Input for parent component compatibility
  @Input() set mode(value: PanelMode) {
    this.modeSignal.set(value);
  }
  get mode(): PanelMode {
    return this.modeSignal();
  }

  // Search control for chapter dropdown
  chapterSearchControl = new FormControl('');

  // Form
  form!: FormGroup;

  // Reset cycle options
  readonly resetCycleOptions = RESET_CYCLE_OPTIONS;

  // No minDate — LAST_RESET_DATE is a historical field, past dates are valid

  // Computed title based on mode signal
  title = computed(() =>
    this.modeSignal() === 'add' ? 'Add New Sequence' : 'Edit Sequence'
  );

  saveButtonText = computed(() =>
    this.mode === 'add' ? 'ADD' : 'SAVE'
  );


  ngOnInit(): void {
    this.loadChapters();
    this.initializeForm();
    this.setupChapterIdListener();
    this.setupChapterSearch();
  }

  /**
   * Lifecycle hook called when @Input() properties change
   * Handles panel mode switching and data updates when panel is already open
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Update mode signal when @Input changes
    if (changes['mode'] && changes['mode'].currentValue !== changes['mode'].previousValue) {
      this.modeSignal.set(changes['mode'].currentValue);
    }

    // When mode or data changes, reinitialize the form
    // This handles:
    // - Switching from 'add' to 'edit' while panel is open
    // - Switching from one edit record to another edit record
    if ((changes['mode'] || changes['data']) && this.form) {
      this.initializeForm();
    }
  }

  private loadChapters(): void {
    this.chapterService.getChapters().subscribe({
      next: (chapters) => {
        this.chapters.set(chapters);
        this.filteredChapters.set(chapters);
      },
      error: () => {
        this.chapters.set([]);
        this.filteredChapters.set([]);
        // Error snackbar handled globally by authInterceptor
      },
    });
  }

  private setupChapterSearch(): void {
    this.chapterSearchControl.valueChanges.subscribe(searchTerm => {
      const term = (searchTerm as string || '').toLowerCase();
      const allChapters = this.chapters();
      this.filteredChapters.set(
        allChapters.filter(chapter =>
          chapter.chapterId.toLowerCase().includes(term) ||
          chapter.chapterName.toLowerCase().includes(term)
        )
      );
    });
  }

  private initializeForm(): void {
    // Reset or create form group
    if (this.form) {
      // Form already exists, reset it
      this.form.reset();
    } else {
      // First time initialization
      this.form = this.fb.group({
        chapterId: ['', Validators.required],
        chapterName: [{ value: '', disabled: true }],
        numberType: ['', [
          Validators.required,
          Validators.maxLength(VALIDATION_SYSTEM_ADMINISTRATION.APPLICATION_SEQUENCE_NUMBERS.LIMITS.NUMBER_TYPE_MAX_LENGTH),
          noWhitespaceOnlyValidator(),
          codeFieldValidator()
        ]],
        maxNumber: ['', [
          Validators.required,
          Validators.min(VALIDATION_SYSTEM_ADMINISTRATION.APPLICATION_SEQUENCE_NUMBERS.LIMITS.INT32_MIN),
          Validators.max(VALIDATION_SYSTEM_ADMINISTRATION.APPLICATION_SEQUENCE_NUMBERS.LIMITS.INT32_MAX)
        ]],
        startingNumber: [null, [Validators.min(0)]],
        resetCycle: [null],
        lastResetDate: [null],
      }, { validators: this.startLessThanMaxValidator });
    }

    // Populate form if editing
    if (this.mode === 'edit' && this.data) {
      this.form.patchValue({
        chapterId: this.data.chapterId,
        chapterName: this.data.chapterName,
        numberType: this.data.numberType,
        maxNumber: this.data.maxNumber,
        startingNumber: this.data.startingNumber,
        resetCycle: this.data.resetCycle,
        lastResetDate: this.data.lastResetDate ? moment(this.data.lastResetDate) : null,
      });
      this.selectedChapterName.set(this.data.chapterName);
    } else {
      // Add mode - ensure chapter name is cleared
      this.selectedChapterName.set('');
    }

    // Reset form state
    this.form.markAsUntouched();
    this.form.markAsPristine();
  }

  // Custom validator to check if start is less than or equal to max
  private startLessThanMaxValidator(control: AbstractControl): ValidationErrors | null {
    const startingNumber = control.get('startingNumber')?.value;
    const maxNumber = control.get('maxNumber')?.value;

    if (startingNumber !== null && maxNumber !== null &&
        startingNumber !== '' && maxNumber !== '' &&
        Number(startingNumber) > Number(maxNumber)) {
      control.get('startingNumber')?.setErrors({ greaterThanMax: true });
      return { startGreaterThanMax: true };
    }

    // Clear the error if validation passes
    const startControl = control.get('startingNumber');
    if (startControl?.hasError('greaterThanMax')) {
      const errors = { ...startControl.errors };
      delete errors['greaterThanMax'];
      startControl.setErrors(Object.keys(errors).length ? errors : null);
    }

    return null;
  }

  private setupChapterIdListener(): void {
    this.form.get('chapterId')?.valueChanges.subscribe(value => {
      if (value) {
        const chapter = this.chapters().find(c => c.chapterId === value);
        if (chapter) {
          this.selectedChapterName.set(chapter.chapterName);
          this.form.patchValue({ chapterName: chapter.chapterName }, { emitEvent: false });
        }
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.form.getRawValue();
    const payload = {
      chapterId: formValue.chapterId,
      numberType: formValue.numberType?.trim()?.toUpperCase(),
      maxNumber: Number(formValue.maxNumber),
      startingNumber: Number(formValue.startingNumber),
      resetCycle: formValue.resetCycle || null,
      lastResetDate: formValue.lastResetDate ? moment(formValue.lastResetDate).format('YYYY-MM-DD') : null,
    };

    if (this.mode === 'add') {
      this.apiService.createSequenceNumber(payload).subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          const message = response.message || 'Operation completed successfully';
          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.save.emit(response.item);
          this.onClose();
        },
        error: () => {
          this.isSubmitting.set(false);
          // Error snackbar handled globally by authInterceptor
        },
      });
    } else {
      const originalChapterId = this.data?.chapterId || '';
      const originalNumberType = this.data?.numberType || '';

      this.apiService.updateSequenceNumber(originalChapterId, originalNumberType, payload).subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          const message = response.message || 'Operation completed successfully';
          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.save.emit(response.item);
          this.onClose();
        },
        error: () => {
          this.isSubmitting.set(false);
          // Error snackbar handled globally by authInterceptor
        },
      });
    }
  }

  // --- Field error getters (BarCode Translation pattern) ---

  getChapterIdError(): string {
    const control = this.form.get('chapterId');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Chapter ID is required';
    return '';
  }

  getNumberTypeError(): string {
    const control = this.form.get('numberType');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Number Type is required';
    if (control.hasError('maxlength')) return 'Number Type must not exceed 20 characters';
    return '';
  }

  getMaxNumberError(): string {
    const control = this.form.get('maxNumber');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return VALIDATION_SYSTEM_ADMINISTRATION.APPLICATION_SEQUENCE_NUMBERS.MESSAGES.MAX_NUMBER_REQUIRED;
    if (control.hasError('min')) return VALIDATION_SYSTEM_ADMINISTRATION.APPLICATION_SEQUENCE_NUMBERS.MESSAGES.MAX_NUMBER_MIN;
    if (control.hasError('max')) return VALIDATION_SYSTEM_ADMINISTRATION.APPLICATION_SEQUENCE_NUMBERS.MESSAGES.MAX_NUMBER_MAX;
    return '';
  }

  getStartingNumberError(): string {
    const control = this.form.get('startingNumber');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Starting Number is required';
    if (control.hasError('min')) return 'Starting Number must be 0 or greater';
    if (control.hasError('greaterThanMax')) return 'Starting Number must not exceed Max Number';
    return '';
  }

  getResetDateError(): string {
    const control = this.form.get('lastResetDate');
    if (!control || !control.touched) return '';
    if (control.hasError('matDatepickerParse')) return 'Reset Date is invalid';
    return '';
  }

  /**
   * Prevent invalid characters and enforce max length in numeric input fields
   * Blocks: e, E, +, -, . (scientific notation and signs)
   * Limits digits to maxDigits (default 10)
   */
  onNumberTypeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/[^a-zA-Z0-9_]/g, '').toUpperCase();
    if (input.value !== sanitized) {
      input.value = sanitized;
      this.form.get('numberType')?.setValue(sanitized, { emitEvent: false });
    }
  }

  preventSpecialChars(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) return;

    if (!/^[a-zA-Z0-9_]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  preventNumberTypePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const sanitized = pastedText.replace(/[^a-zA-Z0-9_]/g, '').toUpperCase();
    if (sanitized) {
      const input = event.target as HTMLInputElement;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const current = input.value;
      const newValue = current.substring(0, start) + sanitized + current.substring(end);
      const trimmed = newValue.substring(0, 20);
      input.value = trimmed;
      this.form.get('numberType')?.setValue(trimmed, { emitEvent: false });
      input.setSelectionRange(start + sanitized.length, start + sanitized.length);
    }
  }

  preventLeadingSpace(event: KeyboardEvent, controlName: string): void {
    if (event.key === ' ') {
      const input = event.target as HTMLInputElement;
      const cursorPos = input.selectionStart || 0;
      const textBeforeCursor = (input.value || '').substring(0, cursorPos);
      if (textBeforeCursor.trim().length === 0) {
        event.preventDefault();
      }
    }
  }

  preventInvalidNumericChars(event: KeyboardEvent, maxDigits: number = 10): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;

    const invalidChars = ['e', 'E', '+', '-', '.'];
    if (invalidChars.includes(event.key)) {
      event.preventDefault();
      return;
    }

    const isDigit = event.key >= '0' && event.key <= '9';
    if (!isDigit) {
      event.preventDefault();
      return;
    }

    const input = event.target as HTMLInputElement;
    if (input.value.length >= maxDigits && input.selectionStart === input.selectionEnd) {
      event.preventDefault();
    }
  }

  preventNonNumericPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') || '';
    if (!/^\d+$/.test(pastedText)) {
      event.preventDefault();
    }
  }
}
