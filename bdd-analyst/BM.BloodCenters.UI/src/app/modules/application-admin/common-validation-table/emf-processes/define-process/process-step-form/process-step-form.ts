import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, FormArray, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { MappingNameLookupDto } from '../../services/manuf-lookup.service';
const DEFAULT_OPERATOR_OPTIONS: string[] = ['OR', 'AND', 'NOT', 'EQUALS', 'IS', 'EQ'];

export interface ProcessStepFormData {
  stepName: string;
  stepSequence?: string;
  conditions: ConditionFormData[];
}

export interface ConditionFormData {
  lookingFor: string;
  dataEntity: string;
  dataSource: string;
  operator: string;
  response: string;
  isExisting?: boolean;
}

@Component({
  selector: 'app-process-step-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './process-step-form.html',
  styleUrls: ['./process-step-form.scss']
})
export class ProcessStepFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input() stepData: ProcessStepFormData | null = null;
  @Input() stepSequence: string = '';
  @Output() save = new EventEmitter<ProcessStepFormData>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  private initialFormSnapshot = '';
  private destroy$ = new Subject<void>();
  private formDestroy$ = new Subject<void>();
  private periodKeyPressed = false;
  private valueBeforeInput: Record<string, string> = {};
  isFormDirty = false;

  operatorSearchControl = new FormControl('');
  filteredOperators: string[] = [];

  get isSaveDisabled(): boolean {
    return this.form.invalid || !this.isFormDirty || this.isSaving;
  }

  @Input() mappingLookups: MappingNameLookupDto[] = [];
  @Input() operatorOptions: string[] = DEFAULT_OPERATOR_OPTIONS;
  @Input() isSaving = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    this.filteredOperators = [...this.operatorOptions];
    this.operatorSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredOperators = this.operatorOptions.filter(op =>
          op.toLowerCase().includes(term)
        );
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stepData']) {
      this.initForm();
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
    const conditionGroups = this.stepData?.conditions?.length
      ? this.stepData.conditions.map(c => this.createConditionGroup(c))
      : [this.createConditionGroup()];

    this.form = this.fb.group({
      stepName: [this.stepData?.stepName || ''],
      conditions: this.fb.array(conditionGroups)
    });

    this.initialFormSnapshot = JSON.stringify(this.form.getRawValue());
    this.isFormDirty = false;

    // Unsubscribe previous form's subscription before wiring up the new one
    this.formDestroy$.next();

    // Track value changes for dirty detection
    this.form.valueChanges.pipe(takeUntil(this.formDestroy$)).subscribe(() => {
      this.isFormDirty = JSON.stringify(this.form.getRawValue()) !== this.initialFormSnapshot;
    });
  }

  private createConditionGroup(data?: ConditionFormData): FormGroup {
    return this.fb.group({
      lookingFor: [{ value: data?.lookingFor || '', disabled: true }],
      dataEntity: [{ value: data?.dataEntity || '', disabled: true }],
      dataSource: [{ value: data?.dataSource || '', disabled: true }],
      operator: [data?.operator || '', [this.operatorConditionalRequired()]],
      response: [data?.response || '', [Validators.required, Validators.maxLength(500)]]
    });
  }

  private operatorConditionalRequired(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const group = control.parent as FormGroup;
      if (!group) return null;
      const dataEntity = group.get('dataEntity')?.value;
      const dataSource = group.get('dataSource')?.value;
      if (dataEntity && dataSource && !control.value) {
        return { required: true };
      }
      return null;
    };
  }

  onLookingForChange(index: number): void {
    const conditionGroup = this.conditions.at(index) as FormGroup;
    const selectedName = conditionGroup.get('lookingFor')?.value;

    if (selectedName) {
      const mapping = this.mappingLookups.find(m => m.mappingName === selectedName);
      if (mapping) {
        conditionGroup.get('dataEntity')?.setValue(mapping.dataTableName || '');
        conditionGroup.get('dataSource')?.setValue(mapping.dataColumnName || '');
      }
    } else {
      conditionGroup.get('dataEntity')?.setValue('');
      conditionGroup.get('dataSource')?.setValue('');
    }
    conditionGroup.get('operator')?.updateValueAndValidity();
  }

  get conditions(): FormArray {
    return this.form.get('conditions') as FormArray;
  }

  addCondition(): void {
    const defaultLookingFor = this.stepData?.stepName || '';
    const mapping = this.mappingLookups.find(m => m.mappingName === defaultLookingFor);
    this.conditions.push(this.createConditionGroup({
      lookingFor: defaultLookingFor,
      dataEntity: mapping?.dataTableName || '',
      dataSource: mapping?.dataColumnName || '',
      operator: '',
      response: ''
    }));
    this.isFormDirty = true;
  }

  removeCondition(index: number): void {
    if (this.conditions.length > 1) {
      this.conditions.removeAt(index);
      this.isFormDirty = JSON.stringify(this.form.getRawValue()) !== this.initialFormSnapshot;
    }
  }

  onClearAll(): void {
    // Clear editable field values (operator, response) without removing condition cards
    this.conditions.controls.forEach(control => {
      const group = control as FormGroup;
      group.get('operator')?.reset('');
      group.get('response')?.reset('');
    });
    this.isFormDirty = JSON.stringify(this.form.getRawValue()) !== this.initialFormSnapshot;
  }

  onSave(): void {
    if (this.form.valid) {
      this.save.emit(this.form.getRawValue());
    } else {
      this.form.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onTextKeyDown(event: KeyboardEvent, conditionIndex: number, controlName: string): void {
    if (event.key === '.') {
      this.periodKeyPressed = true;
    }
    const control = (this.conditions.at(conditionIndex) as FormGroup).get(controlName);
    if (control && typeof control.value === 'string') {
      this.valueBeforeInput[`${conditionIndex}_${controlName}`] = control.value;
    }
  }

  sanitizeInput(conditionIndex: number, controlName: string): void {
    const control = (this.conditions.at(conditionIndex) as FormGroup).get(controlName);
    if (!control) return;
    const value = control.value;
    if (typeof value !== 'string') return;

    let sanitized = value;
    const key = `${conditionIndex}_${controlName}`;
    const prev = this.valueBeforeInput[key];
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

  trimInput(conditionIndex: number, controlName: string): void {
    const control = (this.conditions.at(conditionIndex) as FormGroup).get(controlName);
    if (!control) return;
    const value = control.value;
    if (typeof value === 'string') {
      const trimmed = value.trimEnd();
      if (trimmed !== value) {
        control.setValue(trimmed, { emitEvent: false });
      }
    }
  }

  getConditionSequence(index: number): string {
    const baseSeq = this.stepSequence ? Math.floor(parseFloat(this.stepSequence)) : 0;
    return `Seq ${baseSeq}.${(index + 1).toString().padStart(2, '0')}`;
  }
}
