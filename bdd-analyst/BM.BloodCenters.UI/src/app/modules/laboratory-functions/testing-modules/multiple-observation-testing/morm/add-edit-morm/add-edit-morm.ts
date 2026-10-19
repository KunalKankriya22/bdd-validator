import {
  Component,
  OnInit,
  EventEmitter,
  Output,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import moment, { Moment } from 'moment';

import {
  MormFormValue,
  MormTableModel,
  RESULT_VALUES,
  LookUp
} from '../models/morm.model';

import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import {
  effectiveDateNotPastValidator,
  terminationAfterEffectiveValidator
} from '@shared/validators/date.validators';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

@Component({
  selector: 'app-add-edit-morm',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatProgressSpinnerModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-morm.html',
  styleUrls: ['./add-edit-morm.scss']
})
export class AddEditMormComponent implements OnInit {
  private static nextId = 0;
  protected readonly componentId = `add-edit-morm-${AddEditMormComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @Output() save = new EventEmitter<MormFormValue>();
  @Output() saveAndCreateAnother = new EventEmitter<MormFormValue>();
  @Output() close = new EventEmitter<void>();

  mode: 'add' | 'edit' = 'add';
  data: MormTableModel | null = null;

  form!: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  today = moment().startOf('day');
  resultOptions: LookUp[] = RESULT_VALUES;

  private readonly fb = inject(FormBuilder);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  public readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.initForm();

    if (this.mode === 'edit' && this.data) {
      this.populateForm();
    }
  }

  private initForm(): void {
    const isEditMode = this.mode === 'edit';

    this.form = this.fb.group({
      testId: [
        { value: '', disabled: isEditMode },
        [Validators.required, Validators.maxLength(15)]
      ],
      testType: [
        { value: '', disabled: isEditMode },
        [Validators.required, Validators.maxLength(5)]
      ],
      testIntp: [
        { value: '', disabled: isEditMode },
        [Validators.required, Validators.maxLength(4)]
      ],
      effDate: [
        null,
        isEditMode
          ? [Validators.required]
          : [Validators.required, effectiveDateNotPastValidator(this.chapterTimezoneService)]
      ],
      termDate: [null],
      res01: [''],
      res02: [''],
      res03: [''],
      res04: [''],
      res05: [''],
      res06: [''],
      res07: [''],
      res08: [''],
      res09: [''],
      res10: [''],
      res11: [''],
      res12: [''],
      res13: [''],
      res14: [''],
      res15: [''],
      res16: ['']
    }, {
      validators: [terminationAfterEffectiveValidator()]
    });
  }

  private populateForm(): void {
    if (!this.data) return;

    this.form.patchValue({
      testId: this.data.testId,
      testType: this.data.testType,
      testIntp: this.data.testIntp,
      effDate: this.parseDate(this.data.effDate),
      termDate: this.parseDate(this.data.termDate),
      res01: this.data.res01 === '-' ? '' : this.data.res01,
      res02: this.data.res02 === '-' ? '' : this.data.res02,
      res03: this.data.res03 === '-' ? '' : this.data.res03,
      res04: this.data.res04 === '-' ? '' : this.data.res04,
      res05: this.data.res05 === '-' ? '' : this.data.res05,
      res06: this.data.res06 === '-' ? '' : this.data.res06,
      res07: this.data.res07 === '-' ? '' : this.data.res07,
      res08: this.data.res08 === '-' ? '' : this.data.res08,
      res09: this.data.res09 === '-' ? '' : this.data.res09,
      res10: this.data.res10 === '-' ? '' : this.data.res10,
      res11: this.data.res11 === '-' ? '' : this.data.res11,
      res12: this.data.res12 === '-' ? '' : this.data.res12,
      res13: this.data.res13 === '-' ? '' : this.data.res13,
      res14: this.data.res14 === '-' ? '' : this.data.res14,
      res15: this.data.res15 === '-' ? '' : this.data.res15,
      res16: this.data.res16 === '-' ? '' : this.data.res16
    });
  }

  private parseDate(dateStr: string | null): Moment | null {
    if (!dateStr || dateStr === '-') return null;
    const m = moment(dateStr);
    return m.isValid() ? m : null;
  }

  onEffectiveDateChange(): void {
    this.form.get('termDate')?.updateValueAndValidity();
    this.form.get('effDate')?.markAsTouched();
  }

  onTerminationDateChange(): void {
    this.form.get('termDate')?.markAsTouched();
  }

  onSave(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formValue = this.getFormValue();
    this.save.emit(formValue);
  }

  onSaveAndCreateAnother(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formValue = this.getFormValue();
    this.saveAndCreateAnother.emit(formValue);
  }

  onClose(): void {
    this.close.emit();
  }

  private getFormValue(): MormFormValue {
    const rawValue = this.form.getRawValue(); // Get all values including disabled fields

    return {
      testId: rawValue.testId?.trim() || null,
      testType: rawValue.testType?.trim() || null,
      testIntp: rawValue.testIntp?.trim() || null,
      effDate: rawValue.effDate,
      termDate: rawValue.termDate,
      res01: rawValue.res01 || null,
      res02: rawValue.res02 || null,
      res03: rawValue.res03 || null,
      res04: rawValue.res04 || null,
      res05: rawValue.res05 || null,
      res06: rawValue.res06 || null,
      res07: rawValue.res07 || null,
      res08: rawValue.res08 || null,
      res09: rawValue.res09 || null,
      res10: rawValue.res10 || null,
      res11: rawValue.res11 || null,
      res12: rawValue.res12 || null,
      res13: rawValue.res13 || null,
      res14: rawValue.res14 || null,
      res15: rawValue.res15 || null,
      res16: rawValue.res16 || null
    };
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  get f() {
    return this.form.controls;
  }

  get isAddMode(): boolean {
    return this.mode === 'add';
  }

  get isEditMode(): boolean {
    return this.mode === 'edit';
  }

  get panelTitle(): string {
    return this.isAddMode ? 'Add Result Matrix' : 'Edit Result Matrix';
  }
}
