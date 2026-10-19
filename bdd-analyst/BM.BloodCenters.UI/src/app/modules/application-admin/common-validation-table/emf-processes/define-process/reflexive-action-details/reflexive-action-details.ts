import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { ManufLookupService } from '../../services/manuf-lookup.service';
import { validTableNameValidator, validColumnNameValidator, validFunctionNameValidator } from '../../validators/emf-mapping.validators';

export interface ReflexiveActionDetailsData {
  group: string;
  action: string;
  tableName: string;
  actionOn: string;
  columnName: string;
  actionValue: string;
  processOrder: string;
  alternateProcessOrder: string;
  parentGroup: string;
  operator: string;
  response: string;
  functions: string;
  processAt?: string; // Backend field, not visible in UI but needed for updates
}

@Component({
  selector: 'app-reflexive-action-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './reflexive-action-details.html',
  styleUrls: ['./reflexive-action-details.scss']
})
export class ReflexiveActionDetailsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() actionData: ReflexiveActionDetailsData | null = null;
  @Input() processCode: string = '';
  @Input() isSaving = false;
  @Output() save = new EventEmitter<ReflexiveActionDetailsData>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  private periodKeyPressed = false;
  private valueBeforeInput: Record<string, string> = {};
  private destroy$ = new Subject<void>();
  private formDestroy$ = new Subject<void>();
  isValidatingParentGroup = false;

  @Input() actionOptions: string[] = [];
  @Input() operatorOptions: string[] = [];

  actionSearchControl = new FormControl('');
  operatorSearchControl = new FormControl('');
  columnSearchControl = new FormControl('');
  filteredActions: string[] = [];
  filteredOperators: string[] = [];
  columnOptions: string[] = [];
  filteredColumns: string[] = [];
  isLoadingColumns = false;

  constructor(
    private fb: FormBuilder,
    private manufLookupService: ManufLookupService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.filteredActions = [...this.actionOptions];
    this.filteredOperators = [...this.operatorOptions];

    this.actionSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredActions = this.actionOptions.filter(a => a.toLowerCase().includes(term));
      });

    this.operatorSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredOperators = this.operatorOptions.filter(o => o.toLowerCase().includes(term));
      });

    this.columnSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredColumns = this.columnOptions.filter(c => c.toLowerCase().includes(term));
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['actionData']) {
      this.initForm();
    }
    if (changes['actionOptions']) {
      this.filteredActions = [...this.actionOptions];
    }
    if (changes['operatorOptions']) {
      this.filteredOperators = [...this.operatorOptions];
    }
  }

  ngOnDestroy(): void {
    this.formDestroy$.next();
    this.formDestroy$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    // Kill previous form subscriptions
    this.formDestroy$.next();

    // Reset column options
    this.columnOptions = [];
    this.filteredColumns = [];

    this.form = this.fb.group({
      group: [this.actionData?.group || '', [Validators.required, Validators.maxLength(5)]],
      action: [this.actionData?.action || '', [Validators.required, Validators.maxLength(30)]],
      tableName: [
        this.actionData?.tableName || '',
        [Validators.required, Validators.maxLength(30)],
        [validTableNameValidator((name: string) => this.manufLookupService.validateTableName(name))]
      ],
      actionOn: [this.actionData?.actionOn || '', [Validators.required, Validators.maxLength(30)]],
      columnName: [this.actionData?.columnName || '', [Validators.maxLength(30)]],
      actionValue: [this.actionData?.actionValue || '', [Validators.required, Validators.maxLength(100)]],
      processOrder: [this.actionData?.processOrder || '', [Validators.maxLength(100)]],
      alternateProcessOrder: [this.actionData?.alternateProcessOrder || '', [Validators.maxLength(100)]],
      parentGroup: [this.actionData?.parentGroup || '', [Validators.maxLength(5)]],
      operator: [this.actionData?.operator || '', [Validators.maxLength(30)]],
      response: [this.actionData?.response || '', [Validators.maxLength(500)]],
      functions: [
        this.actionData?.functions || '',
        [Validators.required, Validators.maxLength(500)],
        [validFunctionNameValidator((name: string) => this.manufLookupService.validateFunctionName(name))]
      ]
    });

    // Load columns and update actionOn validator when table name changes
    this.form.get('tableName')?.valueChanges
      .pipe(
        takeUntil(this.formDestroy$),
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(tableName => {
        const trimmed = tableName?.trim();
        const actionOnControl = this.form.get('actionOn');

        if (trimmed) {
          this.isLoadingColumns = true;
          this.columnOptions = [];
          this.filteredColumns = [];
          this.form.get('columnName')?.setValue('');
          this.cdr.markForCheck();

          // Set async validator for actionOn to validate column exists in the table
          actionOnControl?.setAsyncValidators([
            validColumnNameValidator(
              (tbl: string, col: string) => this.manufLookupService.validateColumnName(tbl, col),
              this.form.get('tableName')
            )
          ]);
          actionOnControl?.updateValueAndValidity();

          this.manufLookupService.getColumnNames(trimmed)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (columns) => {
                this.columnOptions = columns;
                this.filteredColumns = [...columns];
                this.isLoadingColumns = false;
                this.cdr.markForCheck();
              },
              error: () => {
                this.columnOptions = [];
                this.filteredColumns = [];
                this.isLoadingColumns = false;
                this.cdr.markForCheck();
              }
            });
        } else {
          this.columnOptions = [];
          this.filteredColumns = [];
          this.form.get('columnName')?.setValue('');
          actionOnControl?.clearAsyncValidators();
          actionOnControl?.updateValueAndValidity();
          this.cdr.markForCheck();
        }
      });

    // Load columns and set actionOn validator for initial table name if present
    if (this.actionData?.tableName) {
      const actionOnControl = this.form.get('actionOn');
      actionOnControl?.setAsyncValidators([
        validColumnNameValidator(
          (tbl: string, col: string) => this.manufLookupService.validateColumnName(tbl, col),
          this.form.get('tableName')
        )
      ]);
      actionOnControl?.markAsPristine();
      actionOnControl?.markAsUntouched();

      this.manufLookupService.getColumnNames(this.actionData.tableName)
        .pipe(takeUntil(this.destroy$))
        .subscribe(columns => {
          this.columnOptions = columns;
          this.filteredColumns = [...columns];
          this.cdr.markForCheck();
        });
    }

    // Validate parent group via API when user enters >= 3 characters
    this.form.get('parentGroup')?.valueChanges
      .pipe(
        takeUntil(this.formDestroy$),
        debounceTime(400),
        distinctUntilChanged(),
        switchMap(value => {
          const control = this.form.get('parentGroup');
          // Clear previous error immediately
          if (control?.hasError('invalidParentGroup')) {
            const errors = { ...control.errors };
            delete errors['invalidParentGroup'];
            control.setErrors(Object.keys(errors).length ? errors : null);
          }

          if (!value || value.trim().length < 3) {
            this.isValidatingParentGroup = false;
            return of(null);
          }

          this.isValidatingParentGroup = true;
          this.cdr.markForCheck();
          return this.manufLookupService.validateParentAction(this.processCode, value.trim());
        })
      )
      .subscribe(isValid => {
        if (isValid === null) return;

        this.isValidatingParentGroup = false;
        // Dismiss interceptor's error snackbar — only inline error should show
        this.snackBar.dismiss();

        const control = this.form.get('parentGroup');
        if (!isValid) {
          control?.setErrors({ ...control.errors, invalidParentGroup: true });
          control?.markAsTouched();
        } else if (control?.hasError('invalidParentGroup')) {
          const errors = { ...control.errors };
          delete errors['invalidParentGroup'];
          control.setErrors(Object.keys(errors).length ? errors : null);
        }
        this.cdr.markForCheck();
      });
  }

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
    const prev = this.valueBeforeInput[controlName];
    if (prev !== undefined && !this.periodKeyPressed) {
      const prevPeriodCount = (prev.match(/\./g) || []).length;
      const currPeriodCount = (value.match(/\./g) || []).length;
      if (currPeriodCount > prevPeriodCount) {
        const lastDotIndex = sanitized.lastIndexOf('.');
        if (lastDotIndex !== -1) {
          sanitized = sanitized.substring(0, lastDotIndex) + sanitized.substring(lastDotIndex + 1);
        }
      }
    }
    this.periodKeyPressed = false;

    sanitized = sanitized.replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
    if (sanitized !== value) {
      control.setValue(sanitized, { emitEvent: false });
    }
  }

  trimInput(controlName: string): void {
    const control = this.form.get(controlName);
    if (!control) return;
    const value = control.value;
    if (typeof value === 'string') {
      const trimmed = value.trimEnd();
      if (trimmed !== value) {
        control.setValue(trimmed, { emitEvent: false });
      }
    }
  }

  onClearAll(): void {
    this.form.reset();
  }

  onSave(): void {
    if (this.form.valid) {
      this.save.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
