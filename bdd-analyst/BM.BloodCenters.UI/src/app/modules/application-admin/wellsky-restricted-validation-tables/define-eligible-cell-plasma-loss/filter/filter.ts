import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { EligibleCellPlasmaLossFilterValue } from '../define-eligible-cell-plasma-loss/define-eligible-cell-plasma-loss';
import { CellTypeOption, StatusOption } from '../models/eligible-plasma-cell-loss.model';

@Component({
  selector: 'app-filter',
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
    MatNativeDateModule,
    MatMomentDateModule,
    MatCheckboxModule,
  ],
  templateUrl: './filter.html',
  styleUrl: './filter.scss',
  providers: [{ provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }],
})
export class Filter implements OnInit {
  @Input() currentFilters: EligibleCellPlasmaLossFilterValue | null = null;
  @Input() cellTypeOptions: CellTypeOption[] = [];
  @Output() apply = new EventEmitter<EligibleCellPlasmaLossFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupValidationRules();
    if (this.currentFilters) {
      this.populateForm();
    }
  }

  // =========================
  // FORM INITIALIZATION
  // =========================

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      cellType: [null],
      showAllRecords: [false],
    });
  }

  private setupValidationRules(): void {
    // Cell Type is always optional (no validation rules needed)
    // This method is kept for consistency but doesn't apply any validators
  }

  private populateForm(): void {
    if (!this.currentFilters) return;

    // Convert status to checkbox value
    // status: 'all' or 'terminated' -> showAllRecords: true
    // status: 'active' -> showAllRecords: false
    const showAllRecords = this.currentFilters.status === 'all' || this.currentFilters.status === 'terminated';

    this.filterForm.patchValue({
      cellType: this.currentFilters.cellType || null,
      showAllRecords: showAllRecords,
    });
  }

  // =========================
  // ACTIONS
  // =========================

  onApply(): void {
    // Don't apply filters if form is invalid
    if (this.filterForm.invalid) {
      return;
    }

    const formValue = this.filterForm.value;

    // Convert checkbox to status API parameter
    // showAllRecords: true -> status: 'all'
    // showAllRecords: false -> status: 'active'
    const status = formValue.showAllRecords ? 'all' : 'active';

    const filters: EligibleCellPlasmaLossFilterValue = {
      cellType: formValue.cellType || null,
      status: status,
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      cellType: null,
      showAllRecords: false,
    });
  }

  onClose(): void {
    this.close.emit();
  }

  // =========================
  // APPLY BUTTON STATE
  // =========================

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm?.value;
    if (!formValue) return true;
    return !formValue.cellType && !formValue.showAllRecords;
  }
}
