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
import { Observable, Subject, takeUntil, forkJoin, switchMap } from 'rxjs';
import moment from 'moment';

import { AntigenRarityApiService } from '../services/antigen-rarity-api.service';
import {
  AntigenRarityTest,
  CombinationNumberDropdown,
  CreateAntigenRarityHeaderDto,
  CreateAntigenRarityDetailDto,
  UpdateAntigenRarityHeaderDto,
  UpdateAntigenRarityDetailDto,
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
  originalRow: AntigenRarityTest;
  terminationDateFilter: (date: moment.Moment | null) => boolean;
  resultOptions: LookUp[];
  filteredResultOptions: LookUp[];
}

@Component({
  selector: 'app-antigen-rarity',
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
  templateUrl: './antigen-rarity.html',
  styleUrls: ['./antigen-rarity.scss']
})
export class AntigenRarityComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  headerForm: FormGroup;

  dataSource: AntigenRarityTest[] = [];
  filteredDataSource: AntigenRarityTest[] = [];

  combinationNumberOptions: CombinationNumberDropdown[] = [];
  filteredCombinationNumberOptions: CombinationNumberDropdown[] = [];
  testIdOptions: LookUp[] = [];
  filteredTestIdOptions: LookUp[] = [];

  combinationNumberFilterCtrl = new FormControl('');
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
    ariaLabel: 'Search antigen rarity tests',
    searchOnEnterOnly: true
  };

  isEditOrAddMode = false;
  isEditingHeader = false;
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
  private currentHeaderEffDate: string | null = null;
  private currentHeaderTermDate: string | null = null;

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  get minDate() {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  get editableRows(): FormGroup[] {
    return this.editableRowsMeta.map(m => m.form);
  }

  get currentCombinationNumber(): number | 'NEW' | '' {
    return this.filterForm.get('combinationNumber')?.value || '';
  }

  get isNewCombination(): boolean {
    return this.currentCombinationNumber === 'NEW';
  }

  constructor(
    private fb: FormBuilder,
    private service: AntigenRarityApiService,
    private headerService: HeaderService,
    private snackbarService: SnackbarService
  ) {
    this.filterForm = this.fb.group({
      combinationNumber: ['', Validators.required],
      rarityPercent: [{ value: '', disabled: true }]
    });

    this.headerForm = this.fb.group({
      rarityPercent: [null, [Validators.required, Validators.min(0), Validators.max(50)]]
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
    this.filterForm.get('combinationNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (this.isEditOrAddMode) {
          this.exitEditMode();
        }
        this.searchText = '';
        this.testIdSortDirection = 'asc';

        if (value === 'NEW') {
          this.filterForm.get('rarityPercent')?.setValue('', { emitEvent: false });
          this.dataSource = [];
          this.filteredDataSource = [];
          this.headerForm.reset();
          this.enterEditMode();
        } else if (value) {
          const selected = this.combinationNumberOptions.find(c => c.matrixId === value);
          this.filterForm.get('rarityPercent')?.setValue(
            selected?.rarityPercent != null ? `${selected.rarityPercent.toFixed(3)}%` : '',
            { emitEvent: false }
          );
          this.loadTableData();
        } else {
          this.filterForm.get('rarityPercent')?.setValue('', { emitEvent: false });
          this.dataSource = [];
          this.filteredDataSource = [];
        }
      });
  }

  loadDropdownOptions(): void {
    this.service.getMatrixIdsLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (combinations) => {
          this.combinationNumberOptions = combinations;
          this.filteredCombinationNumberOptions = [...combinations];
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
    const matrixId = this.currentCombinationNumber;
    if (!matrixId || matrixId === 'NEW') return;

    this.isLoading = true;
    this.hasError = false;

    this.service.getDetailsByMatrixId(matrixId as number, 100, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          if (error?.status === 404) {
            this.dataSource = [];
            this.filteredDataSource = [];
            this.isLoading = false;
          } else {
            this.hasError = true;
            this.isLoading = false;
            this.errorMessage = 'Failed to load data. Please try again.';
          }
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

    if (this.isNewCombination) {
      this.addNewRow();
    }

    this.updateDirtyFormsFlag();
  }

  exitEditMode(): void {
    this.isEditOrAddMode = false;
    this.isEditingHeader = false;
    this.showValidationError = false;
    this.hasAnyDirtyForms = false;
    this.hasAnyInvalidForms = false;
    this.editableRowsMeta = [];
    this.newRows = [];
  }

  cancelEdit(): void {
    if (this.isNewCombination) {
      this.filterForm.get('combinationNumber')?.setValue('');
    }
    this.isEditingHeader = false;
    this.exitEditMode();
  }

  editHeader(): void {
    const matrixId = this.currentCombinationNumber as number;
    this.service.getHeaderById(matrixId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (header) => {
          this.isEditingHeader = true;
          this.currentHeaderEffDate = header.effDate;
          this.currentHeaderTermDate = header.termDate;
          this.headerForm.patchValue({
            rarityPercent: header.rarityPercent
          });
          if (!this.isEditOrAddMode) {
            this.enterEditMode();
          }
        },
        error: () => {
          this.snackbarService.showError('Failed to load header data.');
        }
      });
  }

  getAvailableTestIds(excludeIndex?: number): LookUp[] {
    const usedTestIds = new Set<string>();
    this.editableRowsMeta.forEach(m => usedTestIds.add(m.originalRow.testId));
    this.newRows.forEach((r, i) => {
      if (i !== excludeIndex) {
        const tid = r.form.get('testId')?.value;
        if (tid) usedTestIds.add(tid);
      }
    });
    return this.testIdOptions.filter(opt => !usedTestIds.has(opt.key));
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

    if (this.isNewCombination || this.isEditingHeader) {
      this.headerForm.markAllAsTouched();
      if (this.headerForm.invalid) {
        this.showValidationError = true;
        return;
      }
    }

    if (this.hasValidationErrors()) {
      this.showValidationError = true;
      return;
    }

    this.showValidationError = false;
    this.isSaving = true;

    if (this.isNewCombination) {
      this.saveNewCombination();
    } else {
      this.saveExistingCombination();
    }
  }

  onSearch(searchTerm: string): void {
    this.searchText = searchTerm;
    this.applyFilters();
  }

  onCombinationPanelToggle(opened: boolean): void {
    if (!opened) {
      this.combinationNumberFilterCtrl.setValue('');
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

  showTooltipIfOverflowing(element: HTMLElement, tooltip: MatTooltip): void {
    tooltip.disabled = element.scrollWidth <= element.clientWidth;
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

  getRarityPercentError(): string {
    const control = this.headerForm.get('rarityPercent');
    if (!control?.errors || !control.touched) return '';
    if (control.errors['required']) return 'Rarity Percent is required.';
    if (control.errors['min'] || control.errors['max']) return 'Must be between 0 and 50.';
    return '';
  }

  private saveNewCombination(): void {
    const headerValue = this.headerForm.getRawValue();

    const headerDto: CreateAntigenRarityHeaderDto = {
      rarityPercent: headerValue.rarityPercent,
      effDate: DateFieldValidationUtility.serializeDateForApi(headerValue.effDate) || moment().format('YYYY-MM-DD'),
      termDate: DateFieldValidationUtility.serializeDateForApi(headerValue.termDate)
    };

    this.service.createHeader(headerDto)
      .pipe(
        switchMap(response => {
          const newMatrixId = (response as any).item;
          if (!newMatrixId || newMatrixId <= 0) {
            throw new Error('Failed to create combination header.');
          }

          const detailDtos = this.newRows
            .filter(r => r.form.dirty || r.form.touched)
            .map(r => this.formToCreateDto(r.form, newMatrixId));

          if (detailDtos.length === 0) {
            return forkJoin([]);
          }

          const createObs = detailDtos.map(dto => this.service.createDetail(dto));
          return forkJoin(createObs);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.snackbarService.showSuccess('New combination created successfully.');
          this.exitEditMode();
          this.filterForm.get('combinationNumber')?.setValue('');
          this.filterForm.get('combinationNumber')?.markAsUntouched();
          this.filterForm.get('combinationNumber')?.markAsPristine();
          this.loadDropdownOptions();
        },
        error: () => {
          this.isSaving = false;
        }
      });
  }

  private saveExistingCombination(): void {
    const matrixId = this.currentCombinationNumber as number;

    const createDtos = this.newRows
      .filter(r => r.form.dirty || r.form.touched)
      .map(r => this.formToCreateDto(r.form, matrixId));

    const updateDtos = this.editableRowsMeta
      .filter(m => m.form.dirty)
      .map(m => ({
        matrixId: m.originalRow.matrixId!,
        testId: m.originalRow.testId,
        dto: this.formToUpdateDto(m.form)
      }));

    const createObs = createDtos.map(dto => this.service.createDetail(dto));
    const updateObs = updateDtos.map(item =>
      this.service.updateDetail(item.matrixId, item.testId, item.dto)
    );

    const allOps: Observable<any>[] = [...createObs, ...updateObs];

    if (this.isEditingHeader && this.headerForm.dirty) {
      const headerValue = this.headerForm.getRawValue();
      const headerDto: UpdateAntigenRarityHeaderDto = {
        rarityPercent: headerValue.rarityPercent,
        effDate: this.currentHeaderEffDate || moment().format('YYYY-MM-DD'),
        termDate: this.currentHeaderTermDate
      };
      allOps.push(this.service.updateHeader(matrixId, headerDto));
    }

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
          if (this.isEditingHeader) {
            const newPercent = this.headerForm.getRawValue().rarityPercent;
            this.filterForm.get('rarityPercent')?.setValue(
              newPercent != null ? `${Number(newPercent).toFixed(3)}%` : '',
              { emitEvent: false }
            );
          }
          this.snackbarService.showSuccess(
            `Combination ${matrixId} saved successfully.`
          );
          this.exitEditMode();
          this.loadTableData();
          this.loadDropdownOptions();
        },
        error: () => {
          this.isSaving = false;
        }
      });
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

  private formToCreateDto(form: FormGroup, matrixId: number): CreateAntigenRarityDetailDto {
    const value = form.getRawValue();
    return {
      matrixId,
      testId: value.testId,
      testResult: value.result,
      effDate: DateFieldValidationUtility.serializeDateForApi(value.effDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(value.termDate)
    };
  }

  private formToUpdateDto(form: FormGroup): UpdateAntigenRarityDetailDto {
    const value = form.getRawValue();
    return {
      testResult: value.result,
      effDate: DateFieldValidationUtility.serializeDateForApi(value.effDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(value.termDate)
    };
  }

  private createRowForm(row?: AntigenRarityTest, isNew = false): FormGroup {
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

  private createEditableRowMeta(row: AntigenRarityTest): EditableRowMeta {
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
    const headerDirty = (this.isNewCombination || this.isEditingHeader) && (this.headerForm.dirty || this.headerForm.touched);

    this.hasAnyDirtyForms = headerDirty
      || this.newRows.some(r => r.form.dirty || r.form.touched)
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

    const headerInvalid = (this.isNewCombination || this.isEditingHeader) && this.headerForm.touched && this.headerForm.invalid;

    this.hasAnyInvalidForms = newRowsInvalid || editedRowsInvalid || headerInvalid;

    if (!this.hasAnyInvalidForms) {
      this.showValidationError = false;
    }
  }

  private setupSearchFilters(): void {
    this.combinationNumberFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        if (!search) {
          this.filteredCombinationNumberOptions = [...this.combinationNumberOptions];
        } else {
          const s = search.toLowerCase();
          this.filteredCombinationNumberOptions = this.combinationNumberOptions.filter(
            c => String(c.matrixId).toLowerCase().includes(s) ||
                 (c.antigenCombination && c.antigenCombination.toLowerCase().includes(s))
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
