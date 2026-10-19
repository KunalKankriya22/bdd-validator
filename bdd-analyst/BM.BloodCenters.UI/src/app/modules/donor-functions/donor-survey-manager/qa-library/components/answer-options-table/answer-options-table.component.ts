import { Component, ElementRef, EventEmitter, Input, Output, OnChanges, SimpleChanges, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import moment from 'moment';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { Answer } from '../../models/qa-library.models';

@Component({
  selector: 'app-answer-options-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './answer-options-table.component.html',
  styleUrls: ['./answer-options-table.component.scss']
})
export class AnswerOptionsTableComponent implements OnChanges {
  @Input() answerOptions: Answer[] = [];
  @Input() questionEditable: boolean = true;  // Whether question itself is editable
  @Input() questionEffectiveDate: Date | null = null;
  @Input() questionTerminationDate: Date | null = null;
  @Output() optionsChange = new EventEmitter<Answer[]>();

  // ViewChildren to access template reference variables
  @ViewChildren('answerCodeInput') answerCodeInputs!: QueryList<NgModel>;
  @ViewChildren('answerCodeDescInput') answerCodeDescInputs!: QueryList<NgModel>;
  @ViewChildren('descInputEl') descInputEls!: QueryList<ElementRef>;
  @ViewChildren('effDateInput') effDateInputs!: QueryList<NgModel>;
  @ViewChildren('termDateInput') termDateInputs!: QueryList<NgModel>;

  dirtyRows = new Set<number>();

  // Stores original date values per row index for existing rows (auditKey > 0).
  // Used to determine if a date field was actually changed vs reverted to its original value.
  private originalDates = new Map<number, { effectiveDate: any; terminationDate: any }>();

  // Error state matchers per row that suppress Material's built-in min/filter errors
  // when the date value hasn't actually changed from the original.
  effDateMatchers: ErrorStateMatcher[] = [];
  termDateMatchers: ErrorStateMatcher[] = [];

  // Per-row termination date filters — each closure captures its row reference so it always
  // reads the current row.effectiveDate when the calendar opens (no rebuild needed on eff date change).
  terminationDateFilters: Array<(date: moment.Moment | null) => boolean> = [];

  constructor(
    private headerService: HeaderService,
    private chapterTimezoneService: ChapterTimezoneService
  ) {}

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  get minDate() {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  /**
   * Minimum date for new option rows: max of (chapter today, question effective date)
   * Ensures option effective date is not before question's effective date or in the past
   */
  get optionMinDate(): moment.Moment {
    const chapterToday = this.minDate;
    if (!this.questionEffectiveDate) return chapterToday;

    const questionDate = moment.isMoment(this.questionEffectiveDate)
      ? this.questionEffectiveDate.clone().startOf('day')
      : moment(this.questionEffectiveDate).startOf('day');

    return questionDate.isAfter(chapterToday) ? questionDate : chapterToday;
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['answerOptions']) {
      // Clear dirty tracking when answerOptions are replaced (e.g., when loading a different question)
      if (!changes['answerOptions'].firstChange) {
        this.dirtyRows.clear();
      }

      // Snapshot original dates for existing rows (auditKey > 0) to detect real changes vs reverts.
      // New rows (auditKey === 0) always validate — no snapshot needed.
      this.originalDates.clear();
      this.answerOptions?.forEach((row, i) => {
        if (row.auditKey !== 0) {
          this.originalDates.set(i, {
            effectiveDate: row.effectiveDate,
            terminationDate: row.terminationDate
          });
        }
      });
      this.buildDateErrorMatchers();
    }
  }

  /**
   * Build per-row ErrorStateMatchers for effective/termination date fields.
   * These suppress Material's built-in matDatepickerMin / matDatepickerFilter errors
   * when the date value hasn't changed from the original (i.e., it's a legitimate historical date).
   * New rows always use default error state behavior.
   */
  private buildDateErrorMatchers(): void {
    this.effDateMatchers = (this.answerOptions || []).map((_, i) => ({
      isErrorState: (control: any): boolean => {
        if (!control) return false;
        const row = this.answerOptions[i];
        // Existing row with unchanged date — suppress min/filter errors (legitimate historical date)
        if (!this.isDateChanged(i, 'effectiveDate')) {
          return !!(control.errors?.['matDatepickerParse']);
        }
        // New rows: show error immediately if invalid (don't wait for dirty/touched)
        if (row?.auditKey === 0) {
          return !!control.invalid;
        }
        return !!(control.invalid && (control.dirty || control.touched));
      }
    }));

    this.termDateMatchers = (this.answerOptions || []).map((_, i) => ({
      isErrorState: (control: any): boolean => {
        if (!control) return false;
        const row = this.answerOptions[i];
        if (!this.isDateChanged(i, 'terminationDate')) {
          return !!(control.errors?.['matDatepickerParse']);
        }
        if (row?.auditKey === 0) {
          return !!control.invalid;
        }
        return !!(control.invalid && (control.dirty || control.touched));
      }
    }));

    // Per-row termination date filter. Each closure captures the row object by reference,
    // so row.effectiveDate is always current when the calendar opens — no rebuild needed on eff date change.
    this.terminationDateFilters = (this.answerOptions || []).map((row) =>
      (date: moment.Moment | null): boolean => {
        if (!date) return true;
        const checkDate = moment(date).startOf('day');
        const today = this.chapterTimezoneService.getChapterLocalDate();
        if (checkDate.isBefore(today)) return false;
        if (row.effectiveDate) {
          const effDay = moment(row.effectiveDate).startOf('day');
          if (checkDate.isBefore(effDay)) return false;
        }
        return true;
      }
    );
  }

  /**
   * CRITICAL: Sequence SWAPPING behavior (per user requirement)
   * When dragging row at index 4 (sequence 5) to index 1 (sequence 2):
   * - Row moved TO index 1 gets sequence 2
   * - Row moved FROM index 4 gets sequence 5
   * This is a SWAP, not a recalculation!
   */
  onDrop(event: CdkDragDrop<Answer[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    // Pure swap: exchange the two items at their positions
    const temp = this.answerOptions[previousIndex];
    this.answerOptions[previousIndex] = this.answerOptions[currentIndex];
    this.answerOptions[currentIndex] = temp;

    // Swap sequence numbers so they reflect the new positions
    const tempSeq = this.answerOptions[previousIndex].sequence;
    this.answerOptions[previousIndex].sequence = this.answerOptions[currentIndex].sequence;
    this.answerOptions[currentIndex].sequence = tempSeq;

    // Mark both rows as dirty
    this.dirtyRows.add(previousIndex);
    this.dirtyRows.add(currentIndex);

    this.optionsChange.emit(this.answerOptions);
  }

  addNewOption(): void {
    const maxSequence = this.answerOptions.length > 0
      ? Math.max(...this.answerOptions.map(o => o.sequence || 0))
      : 0;

    this.answerOptions.push({
      sequence: maxSequence + 1,
      answerCode: '',
      answerCodeDescription: '',
      effectiveDate: this.questionEffectiveDate ?? null,
      terminationDate: this.questionTerminationDate ?? null,
      auditKey: 0, // NEW ROW (not saved yet)
      isEditable: true, // NEW rows are always editable
      errors: {}
    });

    this.buildDateErrorMatchers();

    // Validate dates on the new row immediately — if the question's dates are in the past,
    // the new row should show errors right away without waiting for user interaction.
    const newIndex = this.answerOptions.length - 1;
    const newRow = this.answerOptions[newIndex];
    setTimeout(() => this.validateDateFields(newRow, newIndex), 0);

    this.optionsChange.emit(this.answerOptions);
  }

  deleteRow(index: number): void {
    const row = this.answerOptions[index];

    // Only allow deleting new rows (auditKey === 0)
    if (row.auditKey === 0) {
      this.answerOptions.splice(index, 1);
      this.dirtyRows.delete(index);
      this.buildDateErrorMatchers();
      this.optionsChange.emit(this.answerOptions);
    }
  }

  /**
   * Check if a row is blank (no user-entered data)
   * Only applies to NEW rows (auditKey === 0)
   * Dates are excluded because they can be auto-populated from question dates
   */
  private isBlankRow(row: Answer): boolean {
    // Never consider existing rows as blank
    if (row.auditKey !== 0) {
      return false;
    }

    // A row is blank if answerCode and description are both empty
    return (
      (!row.answerCode || row.answerCode.trim() === '') &&
      (!row.answerCodeDescription || row.answerCodeDescription.trim() === '')
    );
  }

  /**
   * Remove all blank new rows from the table
   * Returns number of rows removed
   */
  removeBlankRows(): number {
    const originalLength = this.answerOptions.length;

    // Filter out blank rows
    this.answerOptions = this.answerOptions.filter(row => !this.isBlankRow(row));

    // Notify parent of changes
    this.optionsChange.emit(this.answerOptions);

    return originalLength - this.answerOptions.length;
  }

  /**
   * Triggered on blur - validates the field when user tabs out
   * Uses setTimeout to ensure Angular's built-in validators (e.g. matDatepickerParse) have run
   */
  onFieldBlur(index: number, fieldName: string): void {
    const row = this.answerOptions[index];
    setTimeout(() => this.validateField(row, fieldName, index), 0);
  }

  /**
   * Check if a date field's current value differs from its original saved value.
   * New rows (auditKey === 0) are always considered changed — they must have valid (non-past) dates.
   * Existing rows (auditKey > 0): compare current value against the snapshot taken on load.
   * If the user changes 8→9 this returns true; if they revert 9→8 this returns false.
   */
  isDateChanged(rowIndex: number, fieldName: 'effectiveDate' | 'terminationDate'): boolean {
    const row = this.answerOptions[rowIndex];
    if (!row) return false;
    if (row.auditKey === 0) return true; // new rows always validate

    const orig = this.originalDates.get(rowIndex);
    if (!orig) return true; // no snapshot — treat as changed

    return !this.areDatesEqual(row[fieldName], orig[fieldName]);
  }

  private areDatesEqual(date1: any, date2: any): boolean {
    if (!date1 && !date2) return true;
    if (!date1 || !date2) return false;
    const d1 = moment(date1).format('YYYY-MM-DD');
    const d2 = moment(date2).format('YYYY-MM-DD');
    return d1 === d2;
  }

  onFieldChange(index: number, fieldName: string, value: any): void {
    this.dirtyRows.add(index);
    const row = this.answerOptions[index];

    // [(ngModel)] already updates the field value via two-way binding
    // DO NOT manually set (row as any)[fieldName] = value here
    // For date fields, doing so triggers a re-validation loop that clears matDatepickerParse error

    // Validate the specific field immediately
    setTimeout(() => this.validateField(row, fieldName, index), 0);

    this.optionsChange.emit(this.answerOptions);
  }

  /**
   * Validate a specific field for a row (called on field change)
   */
  private validateField(row: Answer, fieldName: string, rowIndex: number): void {
    if (!row.errors) {
      row.errors = {};
    }

    // Clear the specific field error first
    delete row.errors[fieldName];

    // Validate based on field
    switch (fieldName) {
      case 'answerCode':
        const answerCodeControl = this.answerCodeInputs?.get(rowIndex);
        if (!row.answerCode || row.answerCode.trim() === '') {
          row.errors['answerCode'] = 'This field is required and cannot be left blank.';
        } else if (answerCodeControl?.errors?.['required']) {
          row.errors['answerCode'] = 'This field is required and cannot be left blank.';
        }
        break;

      case 'answerCodeDescription':
        const answerCodeDescControl = this.answerCodeDescInputs?.get(rowIndex);
        if (!row.answerCodeDescription || row.answerCodeDescription.trim() === '') {
          row.errors['answerCodeDescription'] = 'This field is required and cannot be left blank.';
        } else if (answerCodeDescControl?.errors?.['required']) {
          row.errors['answerCodeDescription'] = 'This field is required and cannot be left blank.';
        }
        break;

      case 'effectiveDate':
      case 'terminationDate':
        this.validateDateFields(row, rowIndex);
        break;
    }
  }

  /**
   * Check if a date input has user-typed text (to distinguish invalid format vs empty)
   */
  private hasInputText(control: NgModel | undefined): boolean {
    if (!control) return false;
    const el = (control as any)?.valueAccessor?._elementRef?.nativeElement;
    return el ? el.value?.trim().length > 0 : false;
  }

  /**
   * Validate date fields for a specific row (called on date change)
   */
  private validateDateFields(row: Answer, rowIndex: number): void {
    // Access template controls to check for parse errors
    const effDateControl = this.effDateInputs?.get(rowIndex);
    const termDateControl = this.termDateInputs?.get(rowIndex);
    const hasEffDateParseError = effDateControl?.errors?.['matDatepickerParse'];
    const hasTermDateParseError = termDateControl?.errors?.['matDatepickerParse'];

    // Check native input text to distinguish invalid format vs empty field
    const effDateHasText = this.hasInputText(effDateControl);
    const termDateHasText = this.hasInputText(termDateControl);

    // Clear previous date errors
    if (row.errors) {
      delete row.errors['effectiveDate'];
      delete row.errors['terminationDate'];
    } else {
      row.errors = {};
    }

    // Effective Date validation:
    // Invalid format check applies to ALL rows (new + existing).
    // Not-in-past / before-question-date checks apply only when the value differs from the original.
    if (hasEffDateParseError || (effDateHasText && !row.effectiveDate)) {
      row.errors['effectiveDate'] = 'Effective Date is invalid';
    } else if (this.isDateChanged(rowIndex, 'effectiveDate')) {
      if (!row.effectiveDate) {
        row.errors['effectiveDate'] = 'This field is required and cannot be left blank.';
      } else {
        const effDate = moment.isMoment(row.effectiveDate) ? row.effectiveDate.clone().startOf('day') : moment(row.effectiveDate).startOf('day');
        const today = DateFieldValidationUtility.getMinDate(this.chapterOffset);
        if (effDate.isBefore(today)) {
          row.errors['effectiveDate'] = 'Effective Date cannot be past date';
        } else if (this.questionEffectiveDate) {
          const qEffDate = moment.isMoment(this.questionEffectiveDate)
            ? this.questionEffectiveDate.clone().startOf('day')
            : moment(this.questionEffectiveDate).startOf('day');
          if (effDate.isBefore(qEffDate)) {
            row.errors['effectiveDate'] = 'Effective Date cannot be before Question Effective Date';
          }
        }
      }
    }

    // Termination Date validation
    if (hasTermDateParseError || (termDateHasText && !row.terminationDate)) {
      row.errors['terminationDate'] = 'Termination Date is invalid';
    } else if (row.terminationDate && row.effectiveDate) {
      const termDate = moment.isMoment(row.terminationDate) ? row.terminationDate.clone().startOf('day') : moment(row.terminationDate).startOf('day');
      const effDate = moment.isMoment(row.effectiveDate) ? row.effectiveDate.clone().startOf('day') : moment(row.effectiveDate).startOf('day');

      if (termDate.isBefore(effDate)) {
        row.errors['terminationDate'] = 'Termination Date must be on or after Effective Date';
      } else if (this.isDateChanged(rowIndex, 'terminationDate')) {
        const today = DateFieldValidationUtility.getMinDate(this.chapterOffset);
        if (termDate.isBefore(today)) {
          row.errors['terminationDate'] = 'Termination Date cannot be past date';
        }
      }
    }
  }

  validateRow(row: Answer, rowIndex?: number): boolean {
    let isValid = true;
    row.errors = {};
    const index = rowIndex ?? this.answerOptions.indexOf(row);

    // Required field validations
    if (!row.answerCode || row.answerCode.trim() === '') {
      row.errors['answerCode'] = 'This field is required and cannot be left blank.';
      isValid = false;
    }

    if (!row.answerCodeDescription || row.answerCodeDescription.trim() === '') {
      row.errors['answerCodeDescription'] = 'This field is required and cannot be left blank.';
      isValid = false;
    }

    // Effective Date validation:
    // Invalid format check applies to ALL rows (new + existing).
    // Not-in-past / before-question-date checks apply only when the value differs from the original.
    if (!row.effectiveDate && row.auditKey !== 0) {
      // Existing row with cleared date — treat as invalid format
      row.errors['effectiveDate'] = 'Effective Date is invalid';
      isValid = false;
    } else if (this.isDateChanged(index, 'effectiveDate')) {
      if (!row.effectiveDate) {
        row.errors['effectiveDate'] = 'This field is required and cannot be left blank.';
        isValid = false;
      } else {
        const effDate = moment.isMoment(row.effectiveDate) ? row.effectiveDate.clone().startOf('day') : moment(row.effectiveDate).startOf('day');
        const today = DateFieldValidationUtility.getMinDate(this.chapterOffset);
        if (effDate.isBefore(today)) {
          row.errors['effectiveDate'] = 'Effective Date cannot be past date';
          isValid = false;
        } else if (this.questionEffectiveDate) {
          const qEffDate = moment.isMoment(this.questionEffectiveDate)
            ? this.questionEffectiveDate.clone().startOf('day')
            : moment(this.questionEffectiveDate).startOf('day');
          if (effDate.isBefore(qEffDate)) {
            row.errors['effectiveDate'] = 'Effective Date cannot be before Question Effective Date';
            isValid = false;
          }
        }
      }
    }

    // Termination Date validation
    if (row.terminationDate && row.effectiveDate) {
      const termDate = moment.isMoment(row.terminationDate) ? row.terminationDate.clone().startOf('day') : moment(row.terminationDate).startOf('day');
      const effDate = moment.isMoment(row.effectiveDate) ? row.effectiveDate.clone().startOf('day') : moment(row.effectiveDate).startOf('day');

      if (termDate.isBefore(effDate)) {
        row.errors['terminationDate'] = 'Termination Date must be on or after Effective Date';
        isValid = false;
      } else if (this.isDateChanged(index, 'terminationDate')) {
        const today = DateFieldValidationUtility.getMinDate(this.chapterOffset);
        if (termDate.isBefore(today)) {
          row.errors['terminationDate'] = 'Termination Date cannot be past date';
          isValid = false;
        }
      }
    }

    return isValid;
  }

  validateAllRows(): boolean {
    const results = this.answerOptions.map((row, index) => this.validateRow(row, index));
    return results.every(Boolean);
  }

  hasRowErrors(row: Answer): boolean {
    return !!(row.errors && Object.keys(row.errors).length > 0);
  }

  get hasValidationErrors(): boolean {
    return this.answerOptions.some(row => this.hasRowErrors(row));
  }

  hasNewRows(): boolean {
    return this.answerOptions.some(row => row.auditKey === 0);
  }

  isDescriptionOverflowing(index: number): boolean {
    const el = this.descInputEls?.get(index)?.nativeElement;
    return el ? el.scrollWidth > el.clientWidth : false;
  }

  /**
   * Restrict input to alphanumeric characters only
   * Removes any special characters as user types
   */
  onAnswerCodeInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const originalValue = input.value;
    const sanitizedValue = originalValue.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    if (originalValue !== sanitizedValue) {
      this.answerOptions[index].answerCode = sanitizedValue;
      input.value = sanitizedValue;
      this.optionsChange.emit(this.answerOptions);
    }
  }

  /**
   * Strip leading spaces from answer code description
   */
  onDescriptionInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const originalValue = input.value;
    const sanitizedValue = originalValue.replace(/^\s+/, '');

    if (originalValue !== sanitizedValue) {
      this.answerOptions[index].answerCodeDescription = sanitizedValue;
      input.value = sanitizedValue;
      this.optionsChange.emit(this.answerOptions);
    }
  }
}
