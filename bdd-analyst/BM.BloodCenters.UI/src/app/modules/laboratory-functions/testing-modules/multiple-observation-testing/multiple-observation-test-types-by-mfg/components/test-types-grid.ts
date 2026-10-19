import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  signal,
  computed,
  input,
  output,
  effect,
  ViewChild,
  TemplateRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';

import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { UppercaseMomentDateAdapter } from '@shared/date/uppercase-date-adapter';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableColumn } from '@shared/interfaces/data-table.interface';
import { TestTypesApiService } from '../services/test-types-api.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import {
  MultipleObservationTestTypeDto,
  YES_NO_OPTIONS,
  DefaultControlValueLookupDto
} from '../models/test-types.model';
import {
  yesNoValidator,
  effectiveDateNotInPastValidator,
  terminationDateNotInPastValidator,
  terminationAfterEffectiveValidator,
  testTypeDescriptionValidator,
  effectiveDateRequiredValidator,
  duplicateTestTypeValidator
} from '../validators/test-type.validators';

@Component({
  selector: 'app-test-types-grid',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    DataTable
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter }
  ],
  templateUrl: './test-types-grid.html',
  styleUrl: './test-types-grid.scss'
})
export class TestTypesGridComponent implements OnInit, AfterViewInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `test-types-grid-${TestTypesGridComponent.nextId++}`;

  private readonly fb = inject(FormBuilder);
  private readonly testTypesApiService = inject(TestTypesApiService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  readonly testId = input<string | null>(null);
  readonly testDesc = input<string>('');
  readonly testTypes = input<MultipleObservationTestTypeDto[]>([]);
  readonly controlValues = input<DefaultControlValueLookupDto[]>([]);
  readonly loading = input<boolean>(false);

  readonly save = output<{ modified: MultipleObservationTestTypeDto[]; deleted: string[] }>();
  readonly cancel = output<void>();
  readonly clearAll = output<void>();

  gridForm!: FormGroup;

  @ViewChild('testTypeTemplate', { static: true }) testTypeTemplate!: TemplateRef<any>;
  @ViewChild('testTypeDescTemplate', { static: true }) testTypeDescTemplate!: TemplateRef<any>;
  @ViewChild('controlValueTemplate', { static: true }) controlValueTemplate!: TemplateRef<any>;
  @ViewChild('resUpdateTemplate', { static: true }) resUpdateTemplate!: TemplateRef<any>;
  @ViewChild('othBndTemplate', { static: true }) othBndTemplate!: TemplateRef<any>;
  @ViewChild('fullTechTwoTemplate', { static: true }) fullTechTwoTemplate!: TemplateRef<any>;
  @ViewChild('effDateTemplate', { static: true }) effDateTemplate!: TemplateRef<any>;
  @ViewChild('termDateTemplate', { static: true }) termDateTemplate!: TemplateRef<any>;
  @ViewChild('modDateTemplate', { static: true }) modDateTemplate!: TemplateRef<any>;

  tableConfig: DataTableConfig<FormGroup> = {
    columns: [],
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No test types defined',
    emptySubMessage: 'Click "+ ADD NEW TEST TYPE" to create one.',
    enableRowHighlight: false
  };

  protected get today(): Moment {
    return this.chapterTimezoneService.getChapterLocalDate();
  }
  protected readonly yesNoOptions = YES_NO_OPTIONS;
  readonly hasUnsavedChanges = signal<boolean>(false);
  protected readonly tableData = signal<FormGroup[]>([]);

  protected readonly isEmpty = computed(() =>
    this.testTypesFormArray.length === 0 && !this.loading()
  );

  constructor() {
    effect(() => {
      const types = this.testTypes();
      if (types.length > 0) {
        this.rebuildForm(types);
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
  }

  ngAfterViewInit(): void {
    this.assignCellTemplates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private assignCellTemplates(): void {
    const columns: TableColumn<FormGroup>[] = [
      { key: 'testType', header: 'Test Type Code', width: '116px', headerClass: 'required-header', cellTemplate: this.testTypeTemplate },
      { key: 'testTypeDesc', header: 'Test Type Description', width: '260px', headerClass: 'required-header', cellTemplate: this.testTypeDescTemplate },
      { key: 'defaultControlValue', header: 'Control Value', width: '116px', cellTemplate: this.controlValueTemplate },
      { key: 'resUpdate', header: 'Update Result', width: '116px', headerClass: 'required-header', cellTemplate: this.resUpdateTemplate },
      { key: 'othBnd', header: 'Other Band', width: '116px', headerClass: 'required-header', cellTemplate: this.othBndTemplate },
      { key: 'fullTechTwo', header: 'Tech 2 Required', width: '116px', headerClass: 'required-header', cellTemplate: this.fullTechTwoTemplate },
      { key: 'effDate', header: 'Effective Date', width: '200px', headerClass: 'required-header', cellTemplate: this.effDateTemplate },
      { key: 'termDate', header: 'Termination Date', width: '200px', cellTemplate: this.termDateTemplate },
      { key: 'lastModifiedDate', header: 'Modification Date', width: '130px', cellTemplate: this.modDateTemplate }
    ];

    this.tableConfig = { ...this.tableConfig, columns };
  }

  private initForm(): void {
    this.gridForm = this.fb.group({
      testTypes: this.fb.array([])
    });

    this.gridForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.hasUnsavedChanges.set(this.gridForm.dirty);
      });
  }

  get testTypesFormArray(): FormArray {
    return this.gridForm.get('testTypes') as FormArray;
  }

  private rebuildForm(testTypes: MultipleObservationTestTypeDto[]): void {
    const formArray = this.testTypesFormArray;
    formArray.clear();

    testTypes.forEach(testType => {
      formArray.push(this.createTestTypeFormGroup(testType, false));
    });

    this.gridForm.markAsPristine();
    this.hasUnsavedChanges.set(false);
    this.refreshTableData();
  }

  private createTestTypeFormGroup(testType: MultipleObservationTestTypeDto, isNew: boolean): FormGroup {
    const chapterToday = this.chapterTimezoneService.getChapterLocalDate();
    const isEffDateInPast = testType.effDate
      ? moment(testType.effDate).isBefore(chapterToday)
      : false;

    const group = this.fb.group({
      testId: [{ value: testType.testId, disabled: true }],
      testType: new FormControl(
        { value: testType.testType, disabled: !isNew },
        { validators: [Validators.required, Validators.maxLength(5)], updateOn: 'blur' }
      ),
      testTypeDesc: [
        testType.testTypeDesc,
        [Validators.required, testTypeDescriptionValidator(), Validators.maxLength(30)]
      ],
      defaultControlValue: [testType.defaultControlValue, [Validators.maxLength(30)]],
      resUpdate: [testType.resUpdate, [Validators.required, yesNoValidator()]],
      othBnd: [testType.othBnd, [Validators.required, yesNoValidator()]],
      fullTechTwo: [testType.fullTechTwo, [Validators.required, yesNoValidator()]],
          effDate: [
        { value: testType.effDate ? moment(testType.effDate) : null, disabled: !isNew && isEffDateInPast },
        [
          Validators.required,
          effectiveDateRequiredValidator(),
          ...(isNew || !isEffDateInPast ? [effectiveDateNotInPastValidator(chapterToday)] : [])
        ]
      ],
      termDate: [
        testType.termDate ? moment(testType.termDate) : null,
        [terminationDateNotInPastValidator(chapterToday)]
      ],
      lastModifiedDate: [{ value: testType.lastModifiedDate, disabled: true }],
      isNew: [isNew]
    }, {
      validators: [terminationAfterEffectiveValidator()]
    });

    if (isNew && this.testId()) {
      const testTypeControl = group.get('testType')!;
      testTypeControl.setAsyncValidators(
        duplicateTestTypeValidator(this.testTypesApiService, this.testId()!)
      );
    }

    return group;
  }

  private refreshTableData(): void {
    this.tableData.set([...this.testTypesFormArray.controls] as FormGroup[]);
  }

  onTestTypeInput(control: FormControl): void {
    if (control.value) {
      control.setValue(control.value.toUpperCase(), { emitEvent: true });
    }
  }

  onAddNewTestType(): void {
    if (!this.testId()) return;

    const newTestType: MultipleObservationTestTypeDto = {
      testId: this.testId()!,
      testType: '',
      testTypeDesc: '',
      defaultControlValue: null,
      resUpdate: null,
      othBnd: null,
      fullTechTwo: null,
      effDate: this.chapterTimezoneService.getChapterLocalDate().format('YYYY-MM-DD'),
      termDate: null,
      lastModifiedDate: ''
    };

    const newGroup = this.createTestTypeFormGroup(newTestType, true);
    this.testTypesFormArray.push(newGroup);
    this.gridForm.markAsDirty();
    this.hasUnsavedChanges.set(true);
    this.refreshTableData();
  }

  onSave(): void {
    if (this.gridForm.invalid) {
      this.gridForm.markAllAsTouched();
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const modifiedRows: MultipleObservationTestTypeDto[] = [];

    this.testTypesFormArray.controls.forEach(control => {
      const group = control as FormGroup;
      const isNew = group.get('isNew')?.value;

      if (isNew || group.dirty) {
        const value = group.getRawValue();
        modifiedRows.push({
          testId: this.testId()!,
          testType: value.testType?.toUpperCase() || '',
          testTypeDesc: value.testTypeDesc,
          defaultControlValue: value.defaultControlValue || null,
          resUpdate: value.resUpdate || null,
          othBnd: value.othBnd || null,
          fullTechTwo: value.fullTechTwo || null,
          effDate: value.effDate ? moment(value.effDate).format('YYYY-MM-DD') : '',
          termDate: value.termDate ? moment(value.termDate).format('YYYY-MM-DD') : null,
          lastModifiedDate: value.lastModifiedDate || ''
        });
      }
    });

    this.save.emit({ modified: modifiedRows, deleted: [] });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onClearAll(): void {
    const types = this.testTypes();
    this.rebuildForm(types);
  }

  getControl(row: FormGroup, field: string): FormControl {
    return row.get(field) as FormControl;
  }

  getErrorMessage(row: FormGroup, field: string): string {
    const control = row.get(field);
    if (!control || !control.invalid || !control.touched) return '';

    switch (field) {
      case 'testType':
        if (control.hasError('required')) return 'Test Type Code is required';
        if (control.hasError('maxlength')) return 'Max 5 characters';
        if (control.hasError('duplicateTestType')) return 'Test type already exists for this test';
        break;
      case 'testTypeDesc':
        if (control.hasError('required') || control.hasError('descriptionRequired'))
          return 'Test Type Description must be entered';
        if (control.hasError('maxlength')) return 'Max 30 characters';
        break;
      case 'resUpdate':
        if (control.hasError('required')) return 'Update Result is required';
        if (control.hasError('invalidYesNo')) return 'Value must be Y or N';
        break;
      case 'othBnd':
        if (control.hasError('required')) return 'Other Band is required';
        if (control.hasError('invalidYesNo')) return 'Value must be Y or N';
        break;
      case 'fullTechTwo':
        if (control.hasError('required')) return 'Tech 2 Required is required';
        if (control.hasError('invalidYesNo')) return 'Value must be Y or N';
        break;
      case 'effDate':
        if (control.hasError('matDatepickerParse')) return 'Invalid date format';
        if (control.hasError('required') || control.hasError('effectiveDateRequired'))
          return 'Effective Date must be entered';
        if (control.hasError('dateInPast')) return 'Effective date cannot be in the past';
        break;
      case 'termDate':
        if (control.hasError('matDatepickerParse')) return 'Invalid date format';
        if (control.hasError('terminationDateInPast')) return 'Termination date has passed';
        if (row.hasError('terminationBeforeEffective')) return 'Termination Date must be >= Effective Date';
        break;
    }
    return '';
  }

  hasFieldError(row: FormGroup, field: string): boolean {
    const control = row.get(field);
    if (!control) return false;
    if (field === 'termDate') {
      return (control.invalid && control.touched) ||
        (row.hasError('terminationBeforeEffective') && control.touched);
    }
    return control.invalid && control.touched;
  }

  formatDate(value: string | null): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  isRowNew(row: FormGroup): boolean {
    return row.get('isNew')?.value === true;
  }

  protected elementId(name: string): string {
    return `${this.componentId}-${name}`;
  }

  protected errorId(rowIndex: number, field: string): string {
    return `${this.componentId}-row${rowIndex}-${field}-error`;
  }

  protected getRowIndex(row: FormGroup): number {
    return this.testTypesFormArray.controls.indexOf(row);
  }
}
