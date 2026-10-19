import {
  Component, EventEmitter, Input, OnInit, OnChanges, OnDestroy,
  SimpleChanges, Output, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AsyncValidatorFn } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import moment from 'moment';
import { ParameterDefinitionDto } from '../../interfaces/parameter-definition.interface';
import { ManufLookupService } from '../../services/manuf-lookup.service';
import {
  parameterTypeValidator,
  duplicateParameterCodeValidator,
  refColumnRequiresTableValidator,
  validReferenceTableValidator,
  validReferenceColumnValidator,
  defaultValueTypeValidator,
  requiredNonWhitespace,
  getErrorMessage
} from '../../validators/emf-mapping.validators';

export interface AddParameterPayload {
  parmNo: number;
  parmCode: string;
  parmType: string;
  refTable?: string;
  refColumn?: string;
  defaultValue?: string;
  oldParmCode?: string;
}

@Component({
  selector: 'app-add-parameter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './add-parameter-panel.html',
  styleUrls: ['./add-parameter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddParameterPanel implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() editData: ParameterDefinitionDto | null = null;
  @Input() existingParameterCodes: string[] = [];
  @Input() currentIndex?: number;
  @Output() save = new EventEmitter<AddParameterPayload>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  parameterTypes = ['CHAR', 'NUM', 'DATE'];
  getErrorMessage = getErrorMessage;

  private destroy$ = new Subject<void>();
  private initialFormValue: any = null;

  get isEdit(): boolean { return this.mode === 'edit'; }
  get title(): string { return this.isEdit ? 'Edit Parameter Definition' : 'Add Parameter Definitions'; }
  get isSaveDisabled(): boolean {
    return this.form?.invalid || this.form?.pending || !this.hasFormChanged();
  }

  private hasFormChanged(): boolean {
    if (!this.form || !this.initialFormValue) return false;

    const currentValue = this.form.getRawValue();
    return JSON.stringify(currentValue) !== JSON.stringify(this.initialFormValue);
  }

  /**
   * Get error message for a specific field
   * Returns empty string if field is valid or untouched
   */
  getFieldError(fieldName: string): string {
    const field = this.form?.get(fieldName);
    if (!field) return '';

    // Don't show error if field is not touched/dirty or if it's still pending validation
    if ((!field.touched && !field.dirty) || field.pending) {
      return '';
    }

    // Check specific field errors
    const errors = field.errors;
    if (!errors) return '';

    // Field-specific error messages
    switch (fieldName) {
      case 'parmNo':
        if (errors['required']) return 'Parm No is required';
        if (errors['min']) return 'Parm No must be at least 1';
        if (errors['max']) return 'Parm No cannot exceed 999';
        break;

      case 'parmCode':
        if (errors['required']) return 'Parameter Code is required';
        if (errors['duplicateParameterCode']) return 'This parameter code already exists';
        break;

      case 'parmType':
        if (errors['required']) return 'Parameter Type is required';
        if (errors['invalidParameterType']) return 'Parameter Type must be CHAR, DATE, or NUM';
        break;

      case 'refTable':
        if (errors['required']) return 'Reference Table is required';
        if (errors['invalidRefTable']) return 'One or more reference tables are invalid or not accessible';
        break;

      case 'refColumn':
        if (errors['required']) return 'Reference Column is required';
        if (errors['refColumnWithoutTable']) return 'Reference table must be specified before reference column';
        if (errors['invalidRefColumn']) return 'Reference column not found in any of the specified tables';
        break;

      case 'defaultValue':
        if (errors['invalidDefaultValueForType']) {
          const expectedType = errors['invalidDefaultValueForType'].expectedType;
          if (expectedType === 'number') return 'Default value must be a number for NUM type';
          if (expectedType === 'date') return 'Default value must be a valid date for DATE type';
        }
        break;
    }

    // Fallback to generic error message
    return getErrorMessage(errors);
  }

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private lookupService: ManufLookupService
  ) {}

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editData'] && !changes['editData'].firstChange && this.form) {
      this.patchForm();
    }
    if (changes['existingParameterCodes'] && this.form) {
      // Update duplicate validator when existing codes change
      const codeControl = this.form.get('parmCode');
      codeControl?.updateValueAndValidity();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    // Parameter Code validators - use requiredNonWhitespace to reject whitespace-only strings
    const parmCodeValidators = [
      requiredNonWhitespace(),
      duplicateParameterCodeValidator(this.existingParameterCodes, this.currentIndex)
    ];

    // Parameter Type validators
    const parmTypeValidators = [
      Validators.required,
      parameterTypeValidator()
    ];

    // Reference Table async validators
    const refTableAsyncValidators: AsyncValidatorFn[] = [
      validReferenceTableValidator((tableName: string) => this.lookupService.validateTableName(tableName))
    ];

    this.form = this.fb.group({
      parmNo: [
        this.editData?.parmNo ?? 1,
        [
          Validators.required,
          Validators.min(1),
          Validators.max(999)
        ]
      ],
      parmCode: [
        this.editData?.parmCode ?? '',
        parmCodeValidators
      ],
      parmType: [
        this.editData?.parmType ?? '',
        parmTypeValidators
      ],
      refTable: [
        this.editData?.refTable ?? '',
        [Validators.required],
        refTableAsyncValidators
      ],
      refColumn: [
        this.editData?.refColumn ?? '',
        [Validators.required, refColumnRequiresTableValidator()]
      ],
      defaultValue: [
        this.editData?.defaultValue ?? '',
        [defaultValueTypeValidator()]
      ]
    });

    // Update refColumn async validator when refTable changes
    this.form.get('refTable')?.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe((refTable: string) => {
        const refColumnControl = this.form.get('refColumn');

        if (refTable) {
          refColumnControl?.setAsyncValidators([
            validReferenceColumnValidator(
              (tableName: string, columnName: string) => this.lookupService.validateColumnName(tableName, columnName),
              this.form.get('refTable')
            )
          ]);
        } else {
          refColumnControl?.clearAsyncValidators();
        }

        refColumnControl?.updateValueAndValidity();
        this.cdr.markForCheck();
      });

    // Revalidate and format defaultValue when parmType changes
    this.form.get('parmType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((parmType: string) => {
        const defaultValueControl = this.form.get('defaultValue');
        const defaultValue = defaultValueControl?.value;

        // If changing to DATE type and there's a default value, try to format it
        if (parmType?.toUpperCase() === 'DATE' && defaultValue) {
          const formattedDate = this.formatDateToStandard(defaultValue);
          if (formattedDate && formattedDate !== defaultValue) {
            defaultValueControl?.setValue(formattedDate);
          }
        }

        defaultValueControl?.updateValueAndValidity();
        this.cdr.markForCheck();
      });

    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());

    // Store initial form value for change tracking
    this.initialFormValue = this.form.getRawValue();
  }

  private patchForm(): void {
    this.form.patchValue({
      parmNo:        this.editData?.parmNo ?? 1,
      parmCode:      this.editData?.parmCode ?? '',
      parmType:      this.editData?.parmType ?? '',
      refTable:      this.editData?.refTable ?? '',
      refColumn:     this.editData?.refColumn ?? '',
      defaultValue:  this.editData?.defaultValue ?? ''
    });

    // Update initial form value for change tracking
    this.initialFormValue = this.form.getRawValue();
    this.cdr.markForCheck();
  }

  /**
   * Format default value to DD-MON-YYYY when parameter type is DATE
   * Triggered on blur of the default value field
   */
  onDefaultValueBlur(): void {
    const parmType = this.form.get('parmType')?.value?.toUpperCase();
    const defaultValue = this.form.get('defaultValue')?.value;

    // Only format if parameter type is DATE and there's a value
    if (parmType === 'DATE' && defaultValue) {
      const formattedDate = this.formatDateToStandard(defaultValue);
      if (formattedDate) {
        this.form.get('defaultValue')?.setValue(formattedDate);
        this.cdr.markForCheck();
      }
    }
  }

  /**
   * Format any valid date format to DD-MON-YYYY (e.g., 14-APR-2026)
   * Supports multiple input formats as per date-formats.ts
   */
  private formatDateToStandard(value: string): string | null {
    if (!value || typeof value !== 'string') return null;

    const trimmedValue = value.trim();

    // Try to parse the date using moment (supports multiple formats)
    const parsedDate = moment(trimmedValue, [
      'DD-MMM-YYYY',     // Already in target format
      'DD-MM-YYYY',
      'DD/MMM/YYYY',
      'DD.MMM.YYYY',
      'DD MMM YYYY',
      'YYYY-MMM-DD',
      'MM/DD/YYYY',
      'MM-DD-YYYY',
      'MM.DD.YYYY',
      'YYYY-MM-DD',
      'YYYY/MM/DD',
      'YYYY.MM.DD',
      'MMM DD, YYYY',
      'MMMM DD, YYYY'
    ], true); // strict parsing

    // If parsing failed, try non-strict parsing
    if (!parsedDate.isValid()) {
      const fallbackDate = moment(trimmedValue);
      if (fallbackDate.isValid()) {
        return fallbackDate.format('DD-MMM-YYYY').toUpperCase();
      }
      return null;
    }

    // Format to DD-MON-YYYY (uppercase month)
    return parsedDate.format('DD-MMM-YYYY').toUpperCase();
  }

  /**
   * Prevent leading spaces from being typed in text fields
   */
  onFieldKeyDown(event: KeyboardEvent): void {
    if (event.key === ' ' || event.code === 'Space') {
      const input = event.target as HTMLInputElement;
      const cursorPosition = input.selectionStart || 0;

      // Prevent leading space (cursor at position 0)
      if (cursorPosition === 0) {
        event.preventDefault();
        return;
      }
    }
  }

  onCancel(): void { this.cancel.emit(); }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const payload: AddParameterPayload = this.form.getRawValue();

    // Trim text fields to remove leading and trailing spaces
    if (payload.parmCode) {
      payload.parmCode = payload.parmCode.trim();
    }
    if (payload.refTable) {
      payload.refTable = payload.refTable.trim();
    }
    if (payload.refColumn) {
      payload.refColumn = payload.refColumn.trim();
    }
    if (payload.defaultValue) {
      payload.defaultValue = payload.defaultValue.trim();

      // Format date to DD-MON-YYYY if parameter type is DATE
      if (payload.parmType?.toUpperCase() === 'DATE') {
        const formattedDate = this.formatDateToStandard(payload.defaultValue);
        if (formattedDate) {
          payload.defaultValue = formattedDate;
        }
      }
    }

    // Add oldParmCode when in edit mode
    if (this.isEdit && this.editData?.parmCode) {
      payload.oldParmCode = this.editData.parmCode;
    }

    this.save.emit(payload);
  }
}
