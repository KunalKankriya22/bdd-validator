import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { Subject, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';

import { SpAntigenGroupService } from './services/sp-antigen-group.service';
import {
  SpAntigenGroup,
  SpAntigenGroupParamsDto,
  AntigenGroupDropdown,
  LookUp
} from './models/sp-antigen-group.model';

import { HeaderService } from '@shared/services/header.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';

interface NewRowEntry {
  id: number;
  form: FormGroup;
  terminationDateFilter: (date: moment.Moment | null) => boolean;
}

interface EditableRowMeta {
  form: FormGroup;
  originalRow: SpAntigenGroup;
  terminationDateFilter: (date: moment.Moment | null) => boolean;
}

/**
 * SP' Antigen Groups Component (Child of Special Processing Antigen Grouping and Rarity)
 */
@Component({
  selector: 'app-sp-antigen-groups',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatTableModule,
    MatTooltipModule,
    SearchBar
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './sp-antigen-groups.component.html',
  styleUrls: ['./sp-antigen-groups.component.scss']
})
export class SpAntigenGroupsComponent implements OnInit, OnDestroy {
  @ViewChild('tableCard') tableCard: any;

  filterForm: FormGroup;

  dataSource: SpAntigenGroup[] = [];
  filteredDataSource: SpAntigenGroup[] = [];
  displayedColumns: string[] = ['testId', 'description', 'result', 'effDate', 'termDate', 'modificationDate'];

  // Dropdown options
  antigenGroupOptions: AntigenGroupDropdown[] = [];
  testIdOptions: LookUp[] = [];
  resultOptions: LookUp[] = [];

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Test ID or description',
    minLength: 1,
    ariaLabel: 'Search antigen groups',
    searchOnEnterOnly: false
  };

  // Inline edit mode
  isEditOrAddMode = false;
  showValidationError = false;
  hasAnyDirtyForms = false;
  hasAnyInvalidForms = false;
  isSaving = false;

  editableRowsMeta: EditableRowMeta[] = [];
  newRows: NewRowEntry[] = [];
  private newRowCounter = 0;

  private destroy$ = new Subject<void>();

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  get minDate() {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  get editableRows(): FormGroup[] {
    return this.editableRowsMeta.map(m => m.form);
  }

  constructor(
    private fb: FormBuilder,
    private service: SpAntigenGroupService,
    private headerService: HeaderService,
    private chapterTimezoneService: ChapterTimezoneService,
    private loggingService: LoggingService,
    private snackbarService: SnackbarService
  ) {
    this.filterForm = this.fb.group({
      antigenGroupCode: [''],
      description: ['']
    });

    this.initializeMockData();
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.loadDropdownOptions();
    this.subscribeToFilterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToFilterChanges(): void {
    // Subscribe to antigenGroupCode changes to update description
    this.filterForm.get('antigenGroupCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(code => {
        const selectedGroup = this.antigenGroupOptions.find(g => g.code === code);
        this.filterForm.patchValue(
          { description: selectedGroup?.description || '' },
          { emitEvent: false }
        );

        this.filterMockData(code);
      });
  }

  loadDropdownOptions(): void {
    // Mock dropdown options based on screenshot
    this.antigenGroupOptions = [
      { code: 'Ce*', description: 'C-e-' },
      { code: 'C-e', description: 'C-e-' },
      { code: 'C-w', description: 'C-w-' },
      { code: 'E-c', description: 'E-c-' },
      { code: 'E-w', description: 'E-w-' }
    ];

    this.testIdOptions = [
      { key: 'RH', value: 'RH' },
      { key: 'K', value: 'K' },
      { key: 'FY', value: 'FY' },
      { key: 'JK', value: 'JK' },
      { key: 'S', value: 'S' },
      { key: 'e', value: 'e' }
    ];

    this.resultOptions = [
      { key: 'POS', value: 'POS' },
      { key: 'NEG', value: 'NEG' },
      { key: 'No', value: 'No' }
    ];
  }

  loadTableData(): void {
    // In real implementation, call API here
    // For now, using mock data
  }

  enterEditMode(): void {
    this.isEditOrAddMode = true;
    this.showValidationError = false;
    this.newRows = [];
    this.editableRowsMeta = this.filteredDataSource.map(row => this.createEditableRowMeta(row));
    this.displayedColumns = ['testId', 'description', 'result', 'effDate', 'termDate', 'modificationDate'];

    // Subscribe to form changes for existing rows
    this.editableRowsMeta.forEach(meta => {
      meta.form.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.updateDirtyFormsFlag();
        });

      // Subscribe to effective date changes to revalidate termination date
      meta.form.get('effDate')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          meta.form.get('termDate')?.updateValueAndValidity({ emitEvent: false });
        });
    });

    this.updateDirtyFormsFlag();
  }

  exitEditMode(): void {
    this.isEditOrAddMode = false;
    this.showValidationError = false;
    this.hasAnyDirtyForms = false;
    this.hasAnyInvalidForms = false;
    this.editableRowsMeta = [];
    this.newRows = [];
    this.displayedColumns = ['testId', 'description', 'result', 'effDate', 'termDate', 'modificationDate'];
  }

  cancelEdit(): void {
    this.exitEditMode();
  }

  addNewRow(): void {
    const form = this.createRowForm(undefined, true);

    // Create termination date filter
    const terminationDateFilter = (date: moment.Moment | null): boolean => {
      if (!date) return true;
      const effDate = form.get('effDate')?.value;
      if (!effDate) return true;
      const effMoment = moment.isMoment(effDate) ? effDate : moment(effDate);
      return date.isSameOrAfter(effMoment, 'day');
    };

    const entry: NewRowEntry = {
      id: --this.newRowCounter,
      form,
      terminationDateFilter
    };

    // Subscribe to form changes to track dirty state
    form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateDirtyFormsFlag();
      });

    // Subscribe to effective date changes to revalidate termination date
    form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        form.get('termDate')?.updateValueAndValidity({ emitEvent: false });
      });

    this.newRows.unshift(entry);
    this.updateDirtyFormsFlag();
  }

  removeNewRow(index: number): void {
    this.newRows.splice(index, 1);
  }

  saveAll(): void {
    this.markAllFormsAsTouched();

    if (this.hasValidationErrors()) {
      this.showValidationError = true;
      return;
    }

    this.showValidationError = false;
    this.isSaving = true;

    // Simulate save
    setTimeout(() => {
      this.applyChanges();
      this.isSaving = false;
      this.snackbarService.showSuccess('Antigen groups saved successfully');
      this.exitEditMode();
    }, 500);
  }

  private markAllFormsAsTouched(): void {
    this.newRows.forEach(r => r.form.markAllAsTouched());
    this.editableRowsMeta.forEach(m => m.form.markAllAsTouched());
  }

  private hasValidationErrors(): boolean {
    const newRowErrors = this.newRows.some(r => r.form.invalid && (r.form.dirty || r.form.touched));
    const editRowErrors = this.editableRowsMeta.some(m => m.form.dirty && m.form.invalid);
    return newRowErrors || editRowErrors;
  }

  private applyChanges(): void {
    // Apply new rows
    const newRecords: SpAntigenGroup[] = this.newRows
      .filter(r => r.form.dirty || r.form.touched)
      .map(r => this.formToSpAntigenGroup(r.form));

    // Apply edits
    this.editableRowsMeta.forEach((meta, index) => {
      if (meta.form.dirty) {
        // Find the original row in dataSource
        const dataSourceIndex = this.dataSource.findIndex(
          item => item.testId === meta.originalRow.testId &&
                  item.description === meta.originalRow.description
        );
        if (dataSourceIndex > -1) {
          this.dataSource[dataSourceIndex] = this.formToSpAntigenGroup(meta.form);
        }
      }
    });

    // Add new rows to data source
    this.dataSource = [...newRecords, ...this.dataSource];
    this.applyFilters();
  }

  private formToSpAntigenGroup(form: FormGroup): SpAntigenGroup {
    const value = form.getRawValue();
    return {
      testId: value.testId || '',
      description: value.description || '',
      result: value.result || '',
      effDate: value.effDate ? moment(value.effDate).toDate() : new Date(),
      termDate: value.termDate ? moment(value.termDate).toDate() : null,
      modificationDate: new Date()
    };
  }

  private createRowForm(row?: SpAntigenGroup, isNew = false): FormGroup {
    const form = this.fb.group({
      testId: [row?.testId || '', Validators.required],
      description: [{ value: row?.description || '', disabled: true }],
      result: [row?.result || '', Validators.required],
      effDate: [row?.effDate ? moment(row.effDate) : null, Validators.required],
      termDate: [row?.termDate ? moment(row.termDate) : null],
      modificationDate: [{ value: row?.modificationDate || new Date(), disabled: true }]
    });

    // Add custom validators for dates
    form.get('effDate')?.setValidators([
      Validators.required,
      this.createDateValidator('effectiveDate', row)
    ]);

    form.get('termDate')?.setValidators([
      this.createDateValidator('terminationDate', row)
    ]);

    // Add cross-field validator for termination date >= effective date
    form.setValidators(this.terminationDateValidator());

    return form;
  }

  private createDateValidator(fieldName: 'effectiveDate' | 'terminationDate', originalRow?: SpAntigenGroup) {
    return (control: any) => {
      if (!control.value) {
        return fieldName === 'effectiveDate' ? {
          required: true,
          message: 'This field is required and cannot be left blank.'
        } : null;
      }

      const date = moment.isMoment(control.value) ? control.value.clone().startOf('day') : moment(control.value).startOf('day');

      if (!date.isValid()) {
        const label = fieldName === 'effectiveDate' ? 'Effective Date' : 'Termination Date';
        return {
          invalidDate: true,
          message: `${label} is invalid`
        };
      }

      // Check if date was changed (only validate changed dates for existing rows)
      if (originalRow) {
        const originalDate = originalRow[fieldName === 'effectiveDate' ? 'effDate' : 'termDate'];
        if (originalDate) {
          const origMoment = moment(originalDate).startOf('day');
          if (date.isSame(origMoment, 'day')) {
            // Date unchanged, skip validation
            return null;
          }
        }
      }

      // Validate against chapter effective date (minDate)
      const minDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
      if (date.isBefore(minDate)) {
        const label = fieldName === 'effectiveDate' ? 'Effective' : 'Termination';
        return {
          pastDate: true,
          message: `${label} Date cannot be past date`
        };
      }

      return null;
    };
  }

  private terminationDateValidator() {
    return (form: any) => {
      const effDate = form.get('effDate')?.value;
      const termDate = form.get('termDate')?.value;

      if (!termDate || !effDate) {
        return null;
      }

      const effMoment = moment.isMoment(effDate) ? effDate.clone().startOf('day') : moment(effDate).startOf('day');
      const termMoment = moment.isMoment(termDate) ? termDate.clone().startOf('day') : moment(termDate).startOf('day');

      if (termMoment.isBefore(effMoment)) {
        return {
          terminationBeforeEffective: true,
          message: 'Termination Date must be on or after Effective Date'
        };
      }

      return null;
    };
  }

  getDateErrorMessage(form: FormGroup, fieldName: 'effDate' | 'termDate'): string {
    const control = form.get(fieldName);

    // Check matDatepickerParse error first (invalid date format from Material)
    if (control?.errors?.['matDatepickerParse']) {
      return fieldName === 'effDate' ? 'Effective Date is invalid' : 'Termination Date is invalid';
    }

    if (!control?.errors || !control.touched) {
      return '';
    }

    // Return the message stored in the validator
    if (control.errors['message']) {
      return control.errors['message'];
    }

    // Check form-level error for termination date
    if (fieldName === 'termDate' && form.errors?.['message']) {
      return form.errors['message'];
    }

    return '';
  }

  hasDateError(form: FormGroup, fieldName: 'effDate' | 'termDate'): boolean {
    return !!this.getDateErrorMessage(form, fieldName);
  }

  private createEditableRowMeta(row: SpAntigenGroup): EditableRowMeta {
    const form = this.createRowForm(row, false);

    // Create termination date filter
    const terminationDateFilter = (date: moment.Moment | null): boolean => {
      if (!date) return true;
      const effDate = form.get('effDate')?.value;
      if (!effDate) return true;
      const effMoment = moment.isMoment(effDate) ? effDate : moment(effDate);
      return date.isSameOrAfter(effMoment, 'day');
    };

    return {
      form,
      originalRow: row,
      terminationDateFilter
    };
  }

  formatDate(date: Date | string | null): string {
    if (!date) return '-';

    const d = moment(date);
    return d.format('DD-MMM-YYYY').toUpperCase();
  }

  private initializeMockData(): void {
    // Mock data based on screenshot
    this.dataSource = [
      {
        testId: 'e',
        description: 'e Antigen',
        result: 'No',
        effDate: new Date('2025-01-01'),
        termDate: null,
        modificationDate: new Date('2025-01-11')
      },
      {
        testId: 'K',
        description: 'KELL TYPING',
        result: 'NEG',
        effDate: new Date('2020-01-01'),
        termDate: null,
        modificationDate: new Date('2024-03-15')
      },
      {
        testId: 'FY',
        description: 'DUFFY TYPING',
        result: 'POS',
        effDate: new Date('2020-01-01'),
        termDate: null,
        modificationDate: new Date('2024-03-15')
      },
      {
        testId: 'JK',
        description: 'KIDD TYPING',
        result: 'NEG',
        effDate: new Date('2020-01-01'),
        termDate: new Date('2025-12-31'),
        modificationDate: new Date('2024-03-15')
      }
    ];
    this.filteredDataSource = [...this.dataSource];
  }

  private filterMockData(code: string): void {
    // Filter logic here if needed
    this.applyFilters();
  }

  onSearch(searchTerm: string): void {
    this.searchText = searchTerm;
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.dataSource];

    // Apply search filter
    if (this.searchText && this.searchText.trim()) {
      const searchLower = this.searchText.toLowerCase();
      filtered = filtered.filter(item =>
        item.testId.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower)
      );
    }

    this.filteredDataSource = filtered;
  }

  private updateDirtyFormsFlag(): void {
    this.hasAnyDirtyForms = this.newRows.some(r => r.form.dirty || r.form.touched)
      || this.editableRowsMeta.some(r => r.form.dirty);

    // Check for touched/dirty new rows with invalid fields
    const newRowsInvalid = this.newRows.some(r => {
      if (!r.form.dirty && !r.form.touched) return false;

      // Check each control
      return Object.keys(r.form.controls).some(key => {
        const control = r.form.get(key);
        if (!control) return false;

        // Only count as invalid if it's a required field that's empty or actually invalid
        const isInvalid = control.invalid && (control.dirty || control.touched);
        return isInvalid;
      });
    });

    // Check for edited rows with invalid fields
    const editedRowsInvalid = this.editableRowsMeta.some(r => {
      if (!r.form.dirty) return false;

      return Object.keys(r.form.controls).some(key => {
        const control = r.form.get(key);
        if (!control) return false;

        const isInvalid = control.invalid && control.dirty;
        return isInvalid;
      });
    });

    this.hasAnyInvalidForms = newRowsInvalid || editedRowsInvalid;

    // Clear validation error if all forms are valid
    if (!this.hasAnyInvalidForms) {
      this.showValidationError = false;
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reset edit mode if active
        if (this.isEditOrAddMode) {
          this.exitEditMode();
        }

        // Reload data for new chapter
        this.loadTableData();

        // Revalidate all forms with new chapter's minDate
        this.revalidateAllForms();
      });
  }

  private revalidateAllForms(): void {
    // Revalidate new rows
    this.newRows.forEach(entry => {
      entry.form.get('effDate')?.updateValueAndValidity();
      entry.form.get('termDate')?.updateValueAndValidity();
    });

    // Revalidate existing rows
    this.editableRowsMeta.forEach(meta => {
      meta.form.get('effDate')?.updateValueAndValidity();
      meta.form.get('termDate')?.updateValueAndValidity();
    });
  }

  get currentAntigenGroupCode(): string {
    return this.filterForm.get('antigenGroupCode')?.value || '';
  }
}
