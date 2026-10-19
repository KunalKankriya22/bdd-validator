import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTable, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { SnackbarService } from '@shared/services/snackbar.service';
import { Subject, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';

import { EquipmentQcDataService } from '../../services/equipment-qc-data.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { EquipmentQcRow, Units } from '../../models/equipment-qc-data.model';
import { PaginationConfig } from '@shared/interfaces/data-table.interface';
import { minTargetMaxValidator, numericFieldValidator, detailDateRangeValidator, termDateNotInPastValidator, CrossFieldErrorMatcher } from '../../validators/min-target-max.validator';

@Component({
  selector: 'app-equipment-qc-table',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatDatepickerModule,
  ],
  templateUrl: './equipment-qc-table.component.html',
  styleUrl: './equipment-qc-table.component.scss'
})
export class EquipmentQcTableComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `equipment-qc-table-${EquipmentQcTableComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly equipmentQcDataService = inject(EquipmentQcDataService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatTable) table!: MatTable<AbstractControl>;

  protected readonly editMode = signal<boolean>(false);
  protected readonly unitsOptions = signal<Units[]>([]);

  @Input() set data(value: EquipmentQcRow[]) {
    this.populateForm(value);
    this.originalData = value.map(row => ({ ...row }));
  }

  @Input() set totalRecords(value: number) {
    this._totalRecords.set(value);
  }

  @Input() headerEffectiveDate: Moment | null = null;
  @Input() headerTerminationDate: Moment | null = null;
  @Input() isNewRecord = false;
  @Input() createWorksheet: string | null = null;
  @Input() pagination!: PaginationConfig;

  protected _totalRecords = signal<number>(0);

  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() save = new EventEmitter<EquipmentQcRow[]>();
  @Output() editModeChanged = new EventEmitter<boolean>();

  tableForm: FormGroup = this.fb.group({
    rows: this.fb.array([])
  });

  displayedColumns = [
    'seqNo', 'description', 'units', 'targetValue',
    'minAccept', 'maxAccept', 'effectiveDate', 'terminationDate', 'actions'
  ];

  displayedColumnsReadOnly = [
    'seqNo', 'description', 'units', 'targetValue',
    'minAccept', 'maxAccept', 'effectiveDate', 'terminationDate'
  ];

  protected targetValueErrorMatcher = new CrossFieldErrorMatcher(['targetLessThanMin', 'targetGreaterThanMax', 'negativeTargetWithoutMin']);
  protected minAcceptErrorMatcher = new CrossFieldErrorMatcher(['minGreaterThanMax']);
  protected maxAcceptErrorMatcher = new CrossFieldErrorMatcher(['minGreaterThanMax']);

  private originalData: EquipmentQcRow[] = [];
  private chapterLocalDate: Moment = this.chapterTimezoneService.getChapterLocalDate();

  protected readonly isEmpty = () => this.rows.length === 0;
  protected readonly hasData = () => this.rows.length > 0;

  ngOnInit(): void {
    this.loadUnits();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUnits(): void {
    this.equipmentQcDataService.getUnits()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.unitsOptions.set(data),
        error: () => this.snackbarService.showError('Failed to load units')
      });
  }

  private populateForm(data: EquipmentQcRow[]): void {
    const rowsArray = this.rows;
    rowsArray.clear();
    data.forEach(row => rowsArray.push(this.createRowFormGroup(row)));
    this.table?.renderRows();
  }

  private createRowFormGroup(row?: EquipmentQcRow): FormGroup {
    const termDateValidators = row?.isNew
      ? [termDateNotInPastValidator(this.chapterLocalDate)]
      : [];

    const group = this.fb.group({
      seqNo: [{ value: row?.seqNo || '', disabled: true }],
      description: [row?.description || '', [Validators.required, Validators.maxLength(50)]],
      units: [row?.units || null, [Validators.required]],
      targetValue: [row?.targetValue || null, [Validators.maxLength(12)]],
      minAccept: [row?.minAccept || null, [Validators.maxLength(12)]],
      maxAccept: [row?.maxAccept || null, [Validators.maxLength(12)]],
      effectiveDate: [row?.effectiveDate || null, [Validators.required]],
      terminationDate: [row?.terminationDate || null, termDateValidators],
      isNew: [row?.isNew || false],
      isModified: [row?.isModified || false]
    }, {
      validators: [
        minTargetMaxValidator(),
        detailDateRangeValidator(() => this.headerEffectiveDate, () => this.headerTerminationDate)
      ]
    });

    this.applyUnitsConditionalLogic(group);

    group.get('units')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyUnitsConditionalLogic(group));

    return group;
  }

  private applyUnitsConditionalLogic(group: FormGroup): void {
    const units = group.get('units')?.value;
    const targetCtrl = group.get('targetValue');
    const minCtrl = group.get('minAccept');
    const maxCtrl = group.get('maxAccept');

    if (units === 'FREE') {
      targetCtrl?.setValue(null, { emitEvent: false });
      minCtrl?.setValue(null, { emitEvent: false });
      maxCtrl?.setValue(null, { emitEvent: false });
      targetCtrl?.disable({ emitEvent: false });
      minCtrl?.disable({ emitEvent: false });
      maxCtrl?.disable({ emitEvent: false });
      targetCtrl?.clearValidators();
      minCtrl?.clearValidators();
      maxCtrl?.clearValidators();
    } else if (units === 'CHAR') {
      minCtrl?.setValue(null, { emitEvent: false });
      maxCtrl?.setValue(null, { emitEvent: false });
      targetCtrl?.enable({ emitEvent: false });
      minCtrl?.disable({ emitEvent: false });
      maxCtrl?.disable({ emitEvent: false });
      targetCtrl?.setValidators([Validators.required, Validators.maxLength(12)]);
      minCtrl?.clearValidators();
      maxCtrl?.clearValidators();
    } else {
      targetCtrl?.enable({ emitEvent: false });
      minCtrl?.enable({ emitEvent: false });
      maxCtrl?.enable({ emitEvent: false });
      targetCtrl?.setValidators([Validators.required, Validators.maxLength(12), numericFieldValidator()]);
      minCtrl?.setValidators([Validators.maxLength(12), numericFieldValidator()]);
      maxCtrl?.setValidators([Validators.maxLength(12), numericFieldValidator()]);
    }

    targetCtrl?.updateValueAndValidity({ emitEvent: false });
    minCtrl?.updateValueAndValidity({ emitEvent: false });
    maxCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  get rows(): FormArray {
    return this.tableForm.get('rows') as FormArray;
  }

  protected getRowIndex(row: AbstractControl): number {
    return this.rows.controls.indexOf(row);
  }

  hasUnsavedChanges(): boolean {
    return this.editMode() && this.tableForm.dirty;
  }

  onToggleEditMode(): void {
    if (!this.editMode()) {
      this.originalData = this.rows.controls.map(c => ({ ...c.getRawValue() }));
    }
    this.editMode.update(value => !value);
    this.editModeChanged.emit(this.editMode());
  }

  onAddNewRow(): void {
    if (!this.editMode()) return;

    if (this.createWorksheet !== 'Y') {
      this.snackbarService.showError('Create Worksheet must be set to YES to add new rows.');
      return;
    }

    const maxSeq = this.rows.controls.reduce((max, ctrl) => {
      const num = parseInt(ctrl.get('seqNo')?.value, 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);

    const newRow: EquipmentQcRow = {
      seqNo: (maxSeq + 100).toString(),
      description: '',
      units: null,
      targetValue: null,
      minAccept: null,
      maxAccept: null,
      effectiveDate: this.chapterTimezoneService.getChapterLocalDate().format('YYYY-MM-DD'),
      terminationDate: null,
      isNew: true
    };

    this.rows.push(this.createRowFormGroup(newRow));
    this.table?.renderRows();
    this.cdr.markForCheck();
  }

  onDeleteRow(index: number): void {
    if (!this.editMode()) return;
    this.rows.removeAt(index);
    this.table?.renderRows();
    this.cdr.markForCheck();
  }

  onCancelEdit(): void {
    this.editMode.set(false);
    this.populateForm(this.originalData);
    this.tableForm.markAsPristine();
    this.editModeChanged.emit(false);
  }

  onSave(): void {
    if (this.tableForm.invalid) {
      this.tableForm.markAllAsTouched();
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    if (!this.tableForm.dirty) {
      return;
    }

    const rowsData: EquipmentQcRow[] = this.rows.controls.map(control => {
      const value = control.value;
      return {
        seqNo: control.get('seqNo')?.value,
        description: value.description,
        units: value.units,
        targetValue: value.targetValue,
        minAccept: value.minAccept,
        maxAccept: value.maxAccept,
        effectiveDate: value.effectiveDate,
        terminationDate: value.terminationDate,
        isNew: value.isNew,
        isModified: control.dirty
      };
    });

    this.save.emit(rowsData);
    this.editMode.set(false);
    this.editModeChanged.emit(false);
  }

  onPageChange(event: PageEvent): void {
    if (this.editMode()) {
      this.editMode.set(false);
      this.tableForm.markAsPristine();
      this.tableForm.markAsUntouched();
    }
    this.pageChange.emit(event);
  }

  formatDate(value: string | null): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  onEffectiveDateChange(rowGroup: AbstractControl): void {
    (rowGroup as FormGroup).get('terminationDate')?.updateValueAndValidity();
  }

  getMinEffectiveDate(row: AbstractControl): Moment | null {
    const isNew = row.get('isNew')?.value;
    if (!isNew) return null;
    if (this.headerEffectiveDate && this.headerEffectiveDate.isAfter(this.chapterLocalDate, 'day')) {
      return this.headerEffectiveDate;
    }
    return this.chapterLocalDate;
  }

  getMinTermDate(row: AbstractControl): Moment | null {
    const effDate = row.get('effectiveDate')?.value;
    if (!effDate) return this.chapterLocalDate;
    const eff = moment.isMoment(effDate) ? effDate : moment(effDate);
    return eff.isAfter(this.chapterLocalDate, 'day') ? eff : this.chapterLocalDate;
  }
}
