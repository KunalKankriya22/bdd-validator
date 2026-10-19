import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { Subject, takeUntil, finalize } from 'rxjs';
import moment, { Moment } from 'moment';

import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DriveCategoryRulesService } from '../../services/drive-category-rules.service';
import {
  DriveCategoryRuleModel,
  CreateDriveCategoryRuleRequestDto,
  UpdateDriveCategoryRuleRequestDto,
  DriveCategoryRuleCategoryDto
} from '../../models/drive-category-rules.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-add-edit-rule',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatSnackBarModule,
    MatMomentDateModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-rule.html',
  styleUrls: ['./add-edit-rule.scss']
})
export class AddEditRuleComponent implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: DriveCategoryRuleModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  form: FormGroup;
  panelTitle: string = '';
  panelSubtitle: string = '';

  categoryOptions: DriveCategoryRuleCategoryDto[] = [];
  nextRuleId: string = '';

  isSaving = false;
  minDate: Moment;
  minTerminationDate: Moment | null = null;

  private readonly headerService = inject(HeaderService);
  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  private getChapterMinDate(): moment.Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private driveCategoryRulesService: DriveCategoryRulesService,
    private snackBar: MatSnackBar
  ) {
    this.minDate = this.getChapterMinDate();

    this.form = this.fb.group({
      ruleId: [{ value: '', disabled: true }],
      driveCategory: ['', [Validators.required]],
      description: [{ value: '', disabled: true }],
      numberAllowed: [null],
      maxSize: [null],
      effDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator(this.chapterOffset)]],
      termDate: [null, [DateFieldValidationUtility.effectiveDateNotPastValidator(this.chapterOffset)]]
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()]
    });

    effect(() => {
      const tz = this.headerService.chapterTimeZone();
      this.minDate = this.getChapterMinDate();

      const currentEffDate = this.form.get('effDate')?.value;
      if (currentEffDate && moment.isMoment(currentEffDate) && currentEffDate.isValid()) {
        const chapterToday = this.getChapterMinDate();
        const effStr = currentEffDate.format('YYYY-MM-DD');
        this.minTerminationDate = effStr > chapterToday.format('YYYY-MM-DD') ? currentEffDate.clone().startOf('day') : chapterToday;
      } else {
        this.minTerminationDate = this.getChapterMinDate();
      }

      this.form.get('effDate')?.setValidators([
        Validators.required,
        DateFieldValidationUtility.effectiveDateNotPastValidator(tz)
      ]);
      this.form.get('termDate')?.setValidators([
        DateFieldValidationUtility.effectiveDateNotPastValidator(tz)
      ]);

      this.form.get('effDate')?.updateValueAndValidity({ emitEvent: false });
      this.form.get('termDate')?.updateValueAndValidity({ emitEvent: false });
    });
  }

  ngOnInit(): void {
    this.loadDropdownData();
    this.setupPanel();
    this.setupCategoryListener();
    this.setupEffectiveDateListener();
  }

  private setupCategoryListener(): void {
    this.form.get('driveCategory')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(categoryCode => {
        if (categoryCode) {
          const selectedCategory = this.categoryOptions.find(opt => opt.code === categoryCode);
          if (selectedCategory) {
            this.form.patchValue({ description: selectedCategory.description }, { emitEvent: false });
          }
        }
      });
  }

  private setupEffectiveDateListener(): void {
    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (value && moment.isMoment(value) && value.isValid()) {
          const chapterToday = this.getChapterMinDate();
          const effStr = value.format('YYYY-MM-DD');
          this.minTerminationDate = effStr > chapterToday.format('YYYY-MM-DD') ? value.clone().startOf('day') : chapterToday;
        } else {
          this.minTerminationDate = this.getChapterMinDate();
        }
        this.form.get('termDate')?.updateValueAndValidity();
      });
  }

  private loadDropdownData(): void {
    this.driveCategoryRulesService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categoryOptions = categories;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
        }
      });

    if (this.mode === 'add') {
      this.driveCategoryRulesService.getNextRuleId()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (ruleId) => {
            this.nextRuleId = ruleId;
            this.form.patchValue({ ruleId: this.nextRuleId });
          },
          error: (error) => {
            console.error('Error loading next rule ID:', error);
          }
        });
    }
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
      this.panelTitle = 'Add New Rule';
      this.panelSubtitle = '';
      this.resetFormForAddMode();
      this.minTerminationDate = this.getChapterMinDate();
    } else {
      this.panelTitle = 'Edit Rule';
      this.panelSubtitle = this.getLastModifiedText();
      this.populateFormForEdit();
      this.form.get('effDate')?.disable();
    }
  }

  private resetFormForAddMode(): void {
    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    this.form.get('driveCategory')?.enable();
    this.form.get('effDate')?.enable();

    if (this.nextRuleId) {
      this.form.patchValue({ ruleId: this.nextRuleId });
    }
  }

  private populateFormForEdit(): void {
    if (this.data) {
      this.form.patchValue({
        ruleId: this.data.ruleId || '',
        driveCategory: this.data.driveCategory || '',
        description: this.data.description || '',
        numberAllowed: this.data.numberAllowed ?? null,
        maxSize: this.data.maxSize ?? null,
        effDate: this.data.effDate ? moment(this.data.effDate) : null,
        termDate: this.data.termDate ? moment(this.data.termDate) : null
      });

      // Set minTerminationDate based on effective date
      if (this.data.effDate) {
        const effDate = moment(this.data.effDate).startOf('day');
        const chapterToday = this.getChapterMinDate();
        this.minTerminationDate = effDate.isAfter(chapterToday) ? effDate : chapterToday;
      }
    }
  }

  private getLastModifiedText(): string {
    if (this.data?.lastModifiedDate) {
      return `Last Modified: ${moment(this.data.lastModifiedDate).format('DD-MMM-YYYY').toUpperCase()}`;
    }
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

    const formValue = this.form.getRawValue();
    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const payload: CreateDriveCategoryRuleRequestDto = {
        ruleId: this.nextRuleId,
        driveCategory: formValue.driveCategory?.trim() || '',
        numberAllowed: formValue.numberAllowed,
        maxSize: formValue.maxSize,
        effDate: this.serializeDate(formValue.effDate),
        termDate: formValue.termDate ? this.serializeDate(formValue.termDate) : undefined
      };

      apiCall = this.driveCategoryRulesService.createDriveCategoryRule(payload);
    } else {
      const payload: UpdateDriveCategoryRuleRequestDto = {
        driveCategory: formValue.driveCategory?.trim() || '',
        numberAllowed: formValue.numberAllowed,
        maxSize: formValue.maxSize,
        effDate: this.serializeDate(formValue.effDate),
        termDate: formValue.termDate ? this.serializeDate(formValue.termDate) : undefined
      };

      apiCall = this.driveCategoryRulesService.updateDriveCategoryRule(
        this.data?.ruleId || '',
        this.data?.driveCategory || '',
        payload
      );
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isSaving = false; })
      )
      .subscribe({
        next: (response: any) => {
          const message = response?.message || (this.mode === 'add'
            ? 'Drive category rule added successfully'
            : 'Drive category rule updated successfully');

          this.snackBar.open(message, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          this.saveSuccess.emit();
          this.closePanel.emit();
        },
        error: (error: any) => {
          const message = error?.error?.message || 'An error occurred while saving the drive category rule.';
          this.snackBar.open(message, 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();
    this.isSaving = true;

    const payload: CreateDriveCategoryRuleRequestDto = {
      ruleId: this.nextRuleId,
      driveCategory: formValue.driveCategory?.trim() || '',
      numberAllowed: formValue.numberAllowed,
      maxSize: formValue.maxSize,
      effDate: this.serializeDate(formValue.effDate),
      termDate: formValue.termDate ? this.serializeDate(formValue.termDate) : undefined
    };

    this.driveCategoryRulesService.createDriveCategoryRule(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isSaving = false; })
      )
      .subscribe({
        next: (response: any) => {
          this.snackBar.open(
            response?.message || 'Drive category rule added successfully',
            'Close',
            { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['success-snackbar'] }
          );

          this.saveSuccess.emit();

          this.driveCategoryRulesService.getNextRuleId()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (ruleId) => {
                this.nextRuleId = ruleId;
                this.resetFormForAddMode();
              }
            });
        },
        error: (error: any) => {
          const message = error?.error?.message || 'An error occurred while saving the drive category rule.';
          this.snackBar.open(message, 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private serializeDate(date: Moment | Date | null): string {
    if (!date) return '';
    const m = moment.isMoment(date) ? date : moment(date);
    return m.format('YYYY-MM-DD');
  }

  // Form controls getters
  get driveCategoryControl() { return this.form.get('driveCategory'); }
  get numberAllowedControl() { return this.form.get('numberAllowed'); }
  get maxSizeControl() { return this.form.get('maxSize'); }
  get effDateControl() { return this.form.get('effDate'); }
  get termDateControl() { return this.form.get('termDate'); }

  // Error getters
  getCategoryError(): string {
    const control = this.driveCategoryControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Category is required';
    return '';
  }

  getEffectiveDateError(): string {
    const control = this.effDateControl;
    if (!control || !control.errors || !control.touched) return '';
    if (control.hasError('matDatepickerParse')) return 'Effective Date is invalid';
    if (control.hasError('required')) return 'Effective Date is required';
    if (control.hasError('effectiveDatePast')) return 'Effective date cannot be prior to chapter date';
    return '';
  }

  getEffectiveDateDisplay(): string {
    const effDate = this.form.getRawValue().effDate;
    if (!effDate) return '-';
    const m = moment.isMoment(effDate) ? effDate : moment(effDate);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  getTerminationDateError(): string {
    const control = this.termDateControl;
    if (!control || !control.touched) return '';
    if (control.hasError('matDatepickerParse')) return 'Termination Date is invalid';
    if (control.hasError('matDatepickerMin')) return 'Termination Date must be on or after Effective Date';
    if (this.form.errors?.['dateRangeInvalid']) return 'Termination Date must be on or after Effective Date';
    return '';
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }
}
