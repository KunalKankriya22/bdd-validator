import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Observable, Subject, takeUntil, forkJoin } from 'rxjs';
import moment from 'moment';

import { AntigenGroupApiService } from '../services/antigen-group-api.service';
import {
  AntigenGroupTest,
  AntigenGroupDropdown,
  AntigenGroupQueryParams,
  CreateAntigenGroupTestDto,
  UpdateAntigenGroupTestDto,
  LookUp
} from '../models/sp-antigen-grouping.model';

import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';

interface NewRowEntry {
  id: number;
  form: FormGroup;
  terminationDateFilter: (date: moment.Moment | null) => boolean;
  resultOptions: LookUp[];
  filteredResultOptions: LookUp[];
}

interface EditableRowMeta {
  form: FormGroup;
  originalRow: AntigenGroupTest;
  terminationDateFilter: (date: moment.Moment | null) => boolean;
  resultOptions: LookUp[];
  filteredResultOptions: LookUp[];
}

@Component({
  selector: 'app-antigen-group',
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
    MatTooltipModule,
    SearchBar,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './antigen-group.html',
  styleUrls: ['./antigen-group.scss']
})
export class AntigenGroupComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;

  dataSource: AntigenGroupTest[] = [];
  filteredDataSource: AntigenGroupTest[] = [];
  displayedColumns: string[] = ['testId', 'description', 'result', 'effDate', 'termDate', 'modificationDate'];

  antigenGroupOptions: AntigenGroupDropdown[] = [];
  filteredAntigenGroupOptions: AntigenGroupDropdown[] = [];
  testIdOptions: LookUp[] = [];
  filteredTestIdOptions: LookUp[] = [];

  antigenGroupCodeFilterCtrl = new FormControl('');
  testIdFilterCtrl = new FormControl('');
  resultFilterCtrl = new FormControl('');

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';
  testIdSortDirection: 'asc' | 'desc' = 'asc';

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Test ID or description',
    minLength: 1,
    ariaLabel: 'Search antigen groups',
    searchOnEnterOnly: true
  };

  isEditOrAddMode = false;
  showValidationError = false;
  hasAnyDirtyForms = false;
  hasAnyInvalidForms = false;
  isSaving = false;

  editableRowsMeta: EditableRowMeta[] = [];
  newRows: NewRowEntry[] = [];
  private newRowCounter = 0;

  private destroy$ = new Subject<void>();
  private testResultsCache = new Map<string, LookUp[]>();
  private activeResultRow: NewRowEntry | EditableRowMeta | null = null;

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  get minDate() {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  get editableRows(): FormGroup[] {
    return this.editableRowsMeta.map(m => m.form);
  }

  get currentAntigenGroupCode(): string {
    return this.filterForm.get('antigenGroupCode')?.value || '';
  }

  constructor(
    private fb: FormBuilder,
    private service: AntigenGroupApiService,
    private headerService: HeaderService,
    private snackbarService: SnackbarService
  ) {
    this.filterForm = this.fb.group({
      antigenGroupCode: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.loadDropdownOptions();
    this.subscribeToFilterChanges();
    this.setupSearchFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToFilterChanges(): void {
    this.filterForm.get('antigenGroupCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(code => {
        if (this.isEditOrAddMode) {
          this.exitEditMode();
        }
        this.searchText = '';
        this.testIdSortDirection = 'asc';

        const selectedGroup = this.antigenGroupOptions.find(g => g.code === code);
        this.filterForm.patchValue(
          { description: selectedGroup?.description || '' },
          { emitEvent: false }
        );

        if (code) {
          this.loadTableData();
        } else {
          this.dataSource = [];
          this.filteredDataSource = [];
        }
      });
  }

  loadDropdownOptions(): void {
    this.service.getAntigenGroupsLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groups) => {
          this.antigenGroupOptions = groups;
          this.filteredAntigenGroupOptions = [...groups];
        },
        error: () => {}
      });

    this.service.getTestIdsLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (testIds) => {
          this.testIdOptions = testIds.sort((a, b) => a.key.localeCompare(b.key, undefined, { sensitivity: 'base' }));
          this.filteredTestIdOptions = [...this.testIdOptions];
        },
        error: () => {}
      });
  }

  loadTableData(): void {
    const antigenGroup = this.filterForm.get('antigenGroupCode')?.value;
    if (!antigenGroup) return;

    this.isLoading = true;
    this.hasError = false;

    const params: AntigenGroupQueryParams = {
      antigenGroupCode: antigenGroup,
      searchKeyword: this.searchText || undefined
    };

    this.service.getAntigenGroupTests(100, 0, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.applyFilters();
          this.isLoading = false;
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
        }
      });
  }

  enterEditMode(): void {
    this.isEditOrAddMode = true;
    this.showValidationError = false;
    this.newRows = [];
    this.editableRowsMeta = this.filteredDataSource.map(row => this.createEditableRowMeta(row));

    this.editableRowsMeta.forEach(meta => {
      meta.form.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.updateDirtyFormsFlag();
          meta.form.get('effDate')?.updateValueAndValidity({ emitEvent: false });
        });

      meta.form.get('effDate')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          const termCtrl = meta.form.get('termDate');
          if (termCtrl?.value) {
            termCtrl.updateValueAndValidity({ emitEvent: false });
          }
          this.updateDirtyFormsFlag();
        });

      meta.form.get('termDate')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.updateDirtyFormsFlag();
        });
    });

    this.loadResultOptionsForEditableRows();
    this.updateDirtyFormsFlag();
  }

  exitEditMode(): void {
    this.isEditOrAddMode = false;
    this.showValidationError = false;
    this.hasAnyDirtyForms = false;
    this.hasAnyInvalidForms = false;
    this.editableRowsMeta = [];
    this.newRows = [];
  }

  cancelEdit(): void {
    this.exitEditMode();
  }

  addNewRow(): void {
    const form = this.createRowForm(undefined, true);

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
      terminationDateFilter,
      resultOptions: [],
      filteredResultOptions: []
    };

    form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateDirtyFormsFlag());

    form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const termCtrl = form.get('termDate');
        if (termCtrl?.value) {
          termCtrl.updateValueAndValidity({ emitEvent: false });
        }
        this.updateDirtyFormsFlag();
      });

    form.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateDirtyFormsFlag();
      });

    form.get('testId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(testId => {
        if (testId) {
          const testOption = this.testIdOptions.find(t => t.key === testId);
          form.patchValue(
            { description: testOption?.value || '' },
            { emitEvent: false }
          );

          form.get('result')?.setValue('', { emitEvent: false });
          this.loadResultOptionsForRow(entry, testId);
        } else {
          entry.resultOptions = [];
        }
      });

    this.newRows.unshift(entry);
    this.updateDirtyFormsFlag();
  }

  removeNewRow(index: number): void {
    this.newRows.splice(index, 1);
    this.updateDirtyFormsFlag();
  }

  saveAll(): void {
    this.markAllFormsAsTouched();

    if (this.hasValidationErrors()) {
      this.showValidationError = true;
      return;
    }

    this.showValidationError = false;
    this.isSaving = true;

    const antigenGroup = this.currentAntigenGroupCode;
    const createDtos = this.newRows
      .filter(r => r.form.dirty || r.form.touched)
      .map(r => this.formToCreateDto(r.form, antigenGroup));

    const updateDtos = this.editableRowsMeta
      .filter(m => m.form.dirty)
      .map(m => ({
        antigenGroup,
        testId: m.originalRow.testId,
        dto: this.formToUpdateDto(m.form)
      }));

    const createObs = createDtos.map(dto => this.service.createAntigenGroupTest(dto));
    const updateObs = updateDtos.map(item =>
      this.service.updateAntigenGroupTest(item.antigenGroup, item.testId, item.dto)
    );

    const allOps = [...createObs, ...updateObs];

    if (allOps.length === 0) {
      this.isSaving = false;
      this.exitEditMode();
      return;
    }

    forkJoin(allOps)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          const count = createDtos.length + updateDtos.length;
          this.snackbarService.showSuccess(
            `${count} test(s) saved to Antigen group ${antigenGroup}`
          );
          this.exitEditMode();
          this.loadTableData();
        },
        error: () => {
          this.isSaving = false;
        }
      });
  }

  onSearch(searchTerm: string): void {
    this.searchText = searchTerm;
    this.applyFilters();
  }

  onAntigenGroupPanelToggle(opened: boolean): void {
    if (!opened) {
      this.antigenGroupCodeFilterCtrl.setValue('');
      setTimeout(() => (document.activeElement as HTMLElement)?.blur());
    }
  }

  onTestIdPanelToggle(opened: boolean): void {
    if (!opened) {
      this.testIdFilterCtrl.setValue('');
    }
  }

  onResultPanelToggle(opened: boolean, row?: NewRowEntry | EditableRowMeta): void {
    if (opened) {
      this.activeResultRow = row || null;
    } else {
      this.resultFilterCtrl.setValue('');
      this.activeResultRow = null;
      this.newRows.forEach(r => {
        r.filteredResultOptions = [...r.resultOptions];
      });
      this.editableRowsMeta.forEach(meta => {
        meta.filteredResultOptions = [...meta.resultOptions];
      });
    }
  }

  toggleTestIdSort(): void {
    this.testIdSortDirection = this.testIdSortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  formatDate(date: Date | string | null): string {
    if (!date) return '-';
    const d = moment(date);
    return d.format('DD-MMM-YYYY').toUpperCase();
  }

  getDateErrorMessage(form: FormGroup, fieldName: 'effDate' | 'termDate'): string {
    return fieldName === 'effDate'
      ? DateFieldValidationUtility.getEffectiveDateError(form)
      : DateFieldValidationUtility.getTerminationDateError(form);
  }

  hasDateError(form: FormGroup, fieldName: 'effDate' | 'termDate'): boolean {
    return !!this.getDateErrorMessage(form, fieldName);
  }

  getRequiredFieldError(form: FormGroup, fieldName: string, label: string): string {
    const control = form.get(fieldName);
    if (control?.hasError('required') && control.touched) {
      return `${label} is required.`;
    }
    return '';
  }

  showTooltipIfOverflowing(element: HTMLElement, tooltip: MatTooltip): void {
    tooltip.disabled = element.scrollWidth <= element.clientWidth;
  }

  onEffDateInput(event: Event, form: FormGroup): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      form.get('effDate')
    );
  }

  onTermDateInput(event: Event, form: FormGroup, isEditMode = false): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      form.get('termDate'),
      isEditMode
    );
  }

  private loadResultOptionsForRow(row: NewRowEntry | EditableRowMeta, testId: string): void {
    const cached = this.testResultsCache.get(testId);
    if (cached) {
      row.resultOptions = cached;
      row.filteredResultOptions = [...cached];
      return;
    }

    this.service.getTestResultsLov(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.testResultsCache.set(testId, options);
          row.resultOptions = options;
          row.filteredResultOptions = [...options];
        },
        error: () => {
          row.resultOptions = [];
          row.filteredResultOptions = [];
        }
      });
  }

  private loadResultOptionsForEditableRows(): void {
    const uniqueTestIds = [...new Set(this.editableRowsMeta.map(m => m.originalRow.testId))];
    const uncachedTestIds = uniqueTestIds.filter(id => !this.testResultsCache.has(id));

    if (uncachedTestIds.length === 0) {
      this.editableRowsMeta.forEach(meta => {
        const opts = this.testResultsCache.get(meta.originalRow.testId) || [];
        meta.resultOptions = opts;
        meta.filteredResultOptions = [...opts];
      });
      return;
    }

    const lookups: Record<string, Observable<LookUp[]>> = {};
    uncachedTestIds.forEach(testId => {
      lookups[testId] = this.service.getTestResultsLov(testId);
    });

    forkJoin(lookups)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          Object.entries(results).forEach(([testId, options]) => {
            this.testResultsCache.set(testId, options);
          });

          this.editableRowsMeta.forEach(meta => {
            const opts = this.testResultsCache.get(meta.originalRow.testId) || [];
            meta.resultOptions = opts;
            meta.filteredResultOptions = [...opts];
          });
        },
        error: () => {}
      });
  }

  private markAllFormsAsTouched(): void {
    this.newRows.forEach(r => r.form.markAllAsTouched());
    this.editableRowsMeta.forEach(m => m.form.markAllAsTouched());
  }

  private hasValidationErrors(): boolean {
    const newRowErrors = this.newRows.some(r => r.form.invalid && (r.form.dirty || r.form.touched));
    // For edited rows, only flag errors on controls the user actually changed.
    // Untouched historical EffDates must not block saves on other fields.
    const editRowErrors = this.editableRowsMeta.some(m => {
      if (!m.form.dirty) return false;
      const hasDirtyInvalidControl = Object.keys(m.form.controls).some(key => {
        const ctrl = m.form.get(key);
        return ctrl != null && ctrl.dirty && ctrl.invalid;
      });
      return hasDirtyInvalidControl || (m.form.errors != null);
    });
    return newRowErrors || editRowErrors;
  }

  private formToCreateDto(form: FormGroup, antigenGroup: string): CreateAntigenGroupTestDto {
    const value = form.getRawValue();
    return {
      antigenGroupCode: antigenGroup,
      testId: value.testId,
      testResult: value.result,
      effDate: DateFieldValidationUtility.serializeDateForApi(value.effDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(value.termDate)
    };
  }

  private formToUpdateDto(form: FormGroup): UpdateAntigenGroupTestDto {
    const value = form.getRawValue();
    return {
      testResult: value.result,
      effDate: DateFieldValidationUtility.serializeDateForApi(value.effDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(value.termDate)
    };
  }

  private createRowForm(row?: AntigenGroupTest, isNew = false): FormGroup {
    const originalEffDate = row?.effDate ? moment(row.effDate).format('YYYY-MM-DD') : null;
    const originalTermDate = row?.termDate ? moment(row.termDate).format('YYYY-MM-DD') : null;

    const form = this.fb.group({
      testId: [{ value: row?.testId || '', disabled: !isNew }, Validators.required],
      description: [{ value: row?.description || '', disabled: true }],
      result: [row?.result || '', Validators.required],
      effDate: [row?.effDate ? moment(row.effDate) : null],
      termDate: [row?.termDate ? moment(row.termDate) : null],
      modificationDate: [{ value: row?.modificationDate || null, disabled: true }]
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()]
    });

    if (isNew) {
      form.get('effDate')?.setValidators([
        Validators.required,
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.effectiveDateNotPastValidator(this.chapterOffset)
      ]);
      form.get('termDate')?.setValidators([
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)
      ]);
    } else {
      form.get('effDate')?.setValidators([
        Validators.required,
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        this.editModeEffectiveDateValidator(originalEffDate, this.chapterOffset)
      ]);
      form.get('termDate')?.setValidators([
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.editModeTerminationDateValidator(originalTermDate, this.chapterOffset)
      ]);
    }

    form.get('effDate')?.updateValueAndValidity();
    form.get('termDate')?.updateValueAndValidity();

    return form;
  }

  // Edit-mode EffDate validator: only reject past dates when the user actively changed the field.
  // Historical dates that remain untouched must not block saves on other fields.
  private editModeEffectiveDateValidator(originalEffDate: string | null, chapterTimezone?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const selectedDate = moment.isMoment(value) ? value : moment(value);
      if (!selectedDate.isValid()) return null;

      const selectedDateStr = selectedDate.format('YYYY-MM-DD');

      // Allow unchanged historical date (user didn't modify EffDate)
      if (originalEffDate && selectedDateStr === originalEffDate) return null;

      // If the control hasn't been touched/dirtied, allow any existing value
      if (!control.dirty) return null;

      // User changed EffDate — enforce no-past-date rule
      const today = DateFieldValidationUtility.getMinDate(chapterTimezone);
      if (selectedDateStr < today.format('YYYY-MM-DD')) {
        return { effectiveDatePast: true };
      }

      return null;
    };
  }

  private createEditableRowMeta(row: AntigenGroupTest): EditableRowMeta {
    const form = this.createRowForm(row, false);

    const terminationDateFilter = (date: moment.Moment | null): boolean => {
      if (!date) return true;
      const effDate = form.get('effDate')?.value;
      if (!effDate) return true;
      const effMoment = moment.isMoment(effDate) ? effDate : moment(effDate);
      return date.isSameOrAfter(effMoment, 'day');
    };

    return { form, originalRow: row, terminationDateFilter, resultOptions: [], filteredResultOptions: [] };
  }

  private applyFilters(): void {
    let filtered = [...this.dataSource];

    if (this.searchText?.trim()) {
      const searchLower = this.searchText.toLowerCase();
      filtered = filtered.filter(item =>
        item.testId.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower)
      );
    }

    const dir = this.testIdSortDirection === 'asc' ? 1 : -1;
    filtered.sort((a, b) => a.testId.localeCompare(b.testId, undefined, { sensitivity: 'base' }) * dir);

    this.filteredDataSource = filtered;

    if (this.isEditOrAddMode && this.editableRowsMeta.length > 0) {
      this.editableRowsMeta.sort((a, b) => a.originalRow.testId.localeCompare(b.originalRow.testId, undefined, { sensitivity: 'base' }) * dir);
    }
  }

  private updateDirtyFormsFlag(): void {
    this.hasAnyDirtyForms = this.newRows.some(r => r.form.dirty || r.form.touched)
      || this.editableRowsMeta.some(r => r.form.dirty);

    const newRowsInvalid = this.newRows.some(r => {
      if (!r.form.dirty && !r.form.touched) return false;
      return r.form.invalid;
    });

    // For edited rows, only block Save when a control the user actually changed is invalid.
    // This prevents untouched historical EffDates from blocking saves on other fields.
    const editedRowsInvalid = this.editableRowsMeta.some(r => {
      if (!r.form.dirty) return false;
      const hasDirtyInvalidControl = Object.keys(r.form.controls).some(key => {
        const ctrl = r.form.get(key);
        return ctrl != null && ctrl.dirty && ctrl.invalid;
      });
      return hasDirtyInvalidControl || (r.form.errors != null);
    });

    this.hasAnyInvalidForms = newRowsInvalid || editedRowsInvalid;

    if (!this.hasAnyInvalidForms) {
      this.showValidationError = false;
    }
  }

  private setupSearchFilters(): void {
    this.antigenGroupCodeFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        if (!search) {
          this.filteredAntigenGroupOptions = [...this.antigenGroupOptions];
        } else {
          const s = search.toLowerCase();
          this.filteredAntigenGroupOptions = this.antigenGroupOptions.filter(
            g => g.code.toLowerCase().includes(s)
          );
        }
      });

    this.testIdFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        this.filteredTestIdOptions = this.filterLookUpArray(this.testIdOptions, search);
      });

    this.resultFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        if (this.activeResultRow) {
          this.activeResultRow.filteredResultOptions = this.filterLookUpArray(this.activeResultRow.resultOptions, search);
        }
      });
  }

  private filterLookUpArray(options: LookUp[], search: string | null): LookUp[] {
    if (!search) return [...options];
    const s = search.toLowerCase();
    return options.filter(
      o => o.key.toLowerCase().includes(s) || o.value.toLowerCase().includes(s)
    );
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.isEditOrAddMode) {
          this.exitEditMode();
        }
        this.testResultsCache.clear();
        this.loadTableData();
      });
  }
}
