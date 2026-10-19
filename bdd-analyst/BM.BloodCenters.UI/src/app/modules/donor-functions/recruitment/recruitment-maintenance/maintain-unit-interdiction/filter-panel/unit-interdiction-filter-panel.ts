import { Component, EventEmitter, Output, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { UnitInterdictionFilterValue } from '../models/unit-interdiction.model';

@Component({
  selector: 'app-unit-interdiction-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatInputModule,
    MatIconModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './unit-interdiction-filter-panel.html',
  styleUrls: ['./unit-interdiction-filter-panel.scss']
})
export class UnitInterdictionFilterPanelComponent implements OnInit, OnDestroy {
  @Input() interdictionCodes: { code: string; description: string }[] = [];
  @Input() terminationReasons: { code: string; description: string }[] = [];

  @Output() applyFilters = new EventEmitter<UnitInterdictionFilterValue>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() closePanel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  filterForm!: FormGroup;

  filteredInterdictionCodes: { code: string; description: string }[] = [];
  codeSearchControl = new FormControl('');

  types: string[] = ['INTER', 'SURVE', 'DEFER'];
  filteredTypes: string[] = [];
  typeSearchControl = new FormControl('');

  userIds: string[] = [];
  originatedOptions: string[] = [];

  filteredReasons: { code: string; description: string }[] = [];
  reasonSearchControl = new FormControl('');

  ngOnInit(): void {
    this.initializeForm();
    this.initializeDropdownData();
    this.setupSearchControls();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      codes: [[]],
      types: [[]],
      effectiveDateFrom: [null],
      effectiveDateTo: [null],
      terminationDateFrom: [null],
      terminationDateTo: [null],
      userIds: [[]],
      originated: [[]],
      reasons: [[]]
    });
  }

  private initializeDropdownData(): void {
    // Initialize filtered interdiction codes from @Input
    this.filteredInterdictionCodes = this.interdictionCodes;

    // Initialize filtered termination reasons from @Input
    this.filteredReasons = this.terminationReasons;

    // Initialize filtered types
    this.filteredTypes = this.types;
  }

  private setupSearchControls(): void {
    // Code search
    this.codeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.filterCodes());

    // Type search
    this.typeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.filterTypes());

    // Reason search
    this.reasonSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.filterReasons());
  }

  private filterCodes(): void {
    const searchTerm = (this.codeSearchControl.value || '').toLowerCase().trim();
    if (!searchTerm) {
      this.filteredInterdictionCodes = this.interdictionCodes;
    } else {
      this.filteredInterdictionCodes = this.interdictionCodes.filter(code =>
        code.code.toLowerCase().includes(searchTerm) ||
        code.description.toLowerCase().includes(searchTerm)
      );
    }
  }

  private filterTypes(): void {
    const searchTerm = (this.typeSearchControl.value || '').toLowerCase().trim();
    if (!searchTerm) {
      this.filteredTypes = this.types;
    } else {
      this.filteredTypes = this.types.filter(type =>
        type.toLowerCase().includes(searchTerm)
      );
    }
  }

  private filterReasons(): void {
    const searchTerm = (this.reasonSearchControl.value || '').toLowerCase().trim();
    if (!searchTerm) {
      this.filteredReasons = this.terminationReasons;
    } else {
      this.filteredReasons = this.terminationReasons.filter(reason =>
        reason.code.toLowerCase().includes(searchTerm) ||
        reason.description.toLowerCase().includes(searchTerm)
      );
    }
  }

  onApply(): void {
    const formValue = this.filterForm.value;
    const filters: UnitInterdictionFilterValue = {
      codes: formValue.codes?.length > 0 ? formValue.codes : undefined,
      types: formValue.types?.length > 0 ? formValue.types : undefined,
      effectiveDateFrom: formValue.effectiveDateFrom
        ? this.formatDateForApi(formValue.effectiveDateFrom)
        : undefined,
      effectiveDateTo: formValue.effectiveDateTo
        ? this.formatDateForApi(formValue.effectiveDateTo)
        : undefined,
      terminationDateFrom: formValue.terminationDateFrom
        ? this.formatDateForApi(formValue.terminationDateFrom)
        : undefined,
      terminationDateTo: formValue.terminationDateTo
        ? this.formatDateForApi(formValue.terminationDateTo)
        : undefined,
      userIds: formValue.userIds?.length > 0 ? formValue.userIds : undefined,
      originated: formValue.originated?.length > 0 ? formValue.originated : undefined,
      reasons: formValue.reasons?.length > 0 ? formValue.reasons : undefined
    };

    this.applyFilters.emit(filters);
    this.closePanel.emit();
  }

  onClear(): void {
    this.filterForm.reset({
      codes: [],
      types: [],
      effectiveDateFrom: null,
      effectiveDateTo: null,
      terminationDateFrom: null,
      terminationDateTo: null,
      userIds: [],
      originated: [],
      reasons: []
    });
    this.clearFilters.emit();
    this.closePanel.emit();
  }

  onClose(): void {
    this.closePanel.emit();
  }

  private formatDateForApi(date: Date | moment.Moment): string {
    if (moment.isMoment(date)) {
      return date.format('YYYY-MM-DD');
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
