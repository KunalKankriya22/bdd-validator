import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, effect, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import moment, { Moment } from 'moment';

import { VistaLifeTrakConversionTableService } from './services/vista-lifetrak-conversion-table.service';
import {
  IdpConvRefValueDto,
  CreateIdpConvRefValueDto,
  UpdateIdpConvRefValueDto,
  IdpConvLookupItemDto,
} from './models/vista-lifetrak-conversion-table.model';
import { MasterCodeItem, ValidMasterCodesService } from '@shared/services/valid-master-codes.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

interface NewRowEntry {
  id: number;
  form: FormGroup;
  lastChangedDateField: 'effective' | 'termination' | null;
  targetValueOptions: IdpConvLookupItemDto[];
  filteredTargetValueOptions: IdpConvLookupItemDto[];
  targetValueSearchCtrl: FormControl<string>;
  errors: Record<string, string>;
}

interface EditableRowMeta {
  form: FormGroup;
  originalRow: IdpConvRefValueDto;
  lastChangedDateField: 'effective' | 'termination' | null;
  targetValueOptions: IdpConvLookupItemDto[];
  filteredTargetValueOptions: IdpConvLookupItemDto[];
  targetValueSearchCtrl: FormControl<string>;
  errors: Record<string, string>;
}

@Component({
  selector: 'app-vista-lifetrak-conversion-table',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './vista-lifetrak-conversion-table.html',
  styleUrls: ['./vista-lifetrak-conversion-table.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VistaLifeTrakConversionTableComponent implements OnInit, OnDestroy {

  @ViewChild('addEditBtn', { read: ElementRef }) addEditBtnRef!: ElementRef;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: ''
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by source type or source value',
    minLength: 1,
    ariaLabel: 'Search conversion codes',
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };
  searchText = '';
  sortDirection: 'A' | 'D' | '' = '';

  sourceIdOptions: MasterCodeItem[] = [];
  targetIdOptions: MasterCodeItem[] = [];
  sourceTypeOptions: MasterCodeItem[] = [];
  targetTypeOptions: MasterCodeItem[] = [];
  selectedSourceId = '';
  selectedTargetId = '';

  sourceIdSearchCtrl = new FormControl('');
  targetIdSearchCtrl = new FormControl('');
  sourceTypeSearchCtrl = new FormControl('');
  targetTypeSearchCtrl = new FormControl('');

  private sourceIdSearch = signal('');
  private targetIdSearch = signal('');
  private sourceIdOptionsSignal = signal<MasterCodeItem[]>([]);
  private targetIdOptionsSignal = signal<MasterCodeItem[]>([]);
  private sourceTypeSearch = signal('');
  private targetTypeSearch = signal('');
  private sourceTypeOptionsSignal = signal<MasterCodeItem[]>([]);
  private targetTypeOptionsSignal = signal<MasterCodeItem[]>([]);

  filteredSourceIdOptions = computed(() => {
    const search = this.sourceIdSearch().toLowerCase();
    const options = this.sourceIdOptionsSignal();
    return !search ? options : options.filter(o => o.code.toLowerCase().includes(search) || o.description?.toLowerCase().includes(search));
  });

  filteredTargetIdOptions = computed(() => {
    const search = this.targetIdSearch().toLowerCase();
    const options = this.targetIdOptionsSignal();
    return !search ? options : options.filter(o => o.code.toLowerCase().includes(search) || o.description?.toLowerCase().includes(search));
  });

  filteredSourceTypeOptions = computed(() => {
    const search = this.sourceTypeSearch().toLowerCase();
    const options = this.sourceTypeOptionsSignal();
    return !search ? options : options.filter(o => o.code.toLowerCase().includes(search) || o.description?.toLowerCase().includes(search));
  });

  filteredTargetTypeOptions = computed(() => {
    const search = this.targetTypeSearch().toLowerCase();
    const options = this.targetTypeOptionsSignal();
    return !search ? options : options.filter(o => o.code.toLowerCase().includes(search) || o.description?.toLowerCase().includes(search));
  });

  private allData: IdpConvRefValueDto[] = [];
  dataSource: IdpConvRefValueDto[] = [];
  totalCount = 0;
  isLoading = false;
  hasRetrieved = false;
  hasError = false;
  isSaving = false;

  isEditOrAddMode = false;

  get showValidationError(): boolean {
    if (!this.isEditOrAddMode) return false;
    return [
      ...this.newRows.map(r => ({ form: r.form, isNew: true })),
      ...this.editableRowsMeta.map(r => ({ form: r.form, isNew: false }))
    ].some(({ form, isNew }) => {
      if (!isNew && !form.dirty) return false;
      if (isNew) {
        if (form.dirty || form.touched) return form.invalid;
        return false;
      }
      return Object.keys(form.controls).some(key => {
        const control = form.get(key);
        if (!control || !control.invalid) return false;
        return control.touched || control.dirty;
      });
    });
  }

  get hasAnyDirtyForms(): boolean {
    if (!this.isEditOrAddMode) return false;
    return this.newRows.some(r => r.form.dirty || r.form.touched)
      || this.editableRowsMeta.some(r => r.form.dirty);
  }

  get hasAnyInvalidForms(): boolean {
    if (!this.isEditOrAddMode) return false;
    return this.newRows.some(r => {
      const isTouched = r.form.touched || r.form.dirty;
      return isTouched && r.form.invalid;
    }) || this.editableRowsMeta.some(r => {
      return r.form.dirty && r.form.invalid;
    });
  }
  editableRowsMeta: EditableRowMeta[] = [];
  newRows: NewRowEntry[] = [];
  private newRowCounter = 0;
  currentSearchKeyword = '';
  sourceIdError = '';
  targetIdError = '';

  minDate!: Moment;

  private destroy$ = new Subject<void>();

  get isRetrieveDisabled(): boolean {
    return !this.selectedSourceId || !this.selectedTargetId || this.isLoading;
  }

  get editableRows(): FormGroup[] {
    return this.editableRowsMeta.map(m => m.form);
  }

  constructor(
    private conversionTableService: VistaLifeTrakConversionTableService,
    private lookupService: ValidMasterCodesService,
    private snackBar: MatSnackBar,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private cdr: ChangeDetectorRef
  ) {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    this.loadLookups();
    this.subscribeToChapterChanges();
    this.setupSearchSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
        this.clearAll();
        this.searchText = '';
        this.sourceIdOptions = [];
        this.targetIdOptions = [];
        this.sourceTypeOptions = [];
        this.targetTypeOptions = [];
        this.sourceIdOptionsSignal.set([]);
        this.targetIdOptionsSignal.set([]);
        this.sourceTypeOptionsSignal.set([]);
        this.targetTypeOptionsSignal.set([]);
        this.sourceIdSearchCtrl.setValue('');
        this.targetIdSearchCtrl.setValue('');
        this.sourceTypeSearchCtrl.setValue('');
        this.targetTypeSearchCtrl.setValue('');
        this.lookupService.clearCache('IDPSR');
        this.lookupService.clearCache('IDPTR');
        this.lookupService.clearCache('IDPTP');
        this.lookupService.clearCache('IDPTV');
        this.loadLookups();
        this.cdr.markForCheck();
      });
  }

  private loadLookups(): void {
    forkJoin({
      sourceIds: this.conversionTableService.getSourceIdLookup(),
      targetIds: this.conversionTableService.getTargetIdLookup()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ sourceIds, targetIds }) => {
          this.sourceIdOptions = sourceIds;
          this.targetIdOptions = targetIds;
          this.sourceIdOptionsSignal.set(sourceIds);
          this.targetIdOptionsSignal.set(targetIds);
          this.cdr.markForCheck();
        },
        error: () => { this.showError('Failed to load lookup values'); this.cdr.markForCheck(); }
      });
  }

  private setupSearchSubscriptions(): void {
    this.sourceIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.sourceIdSearch.set(v || ''));

    this.targetIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.targetIdSearch.set(v || ''));

    this.sourceTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.sourceTypeSearch.set(v || ''));

    this.targetTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.targetTypeSearch.set(v || ''));
  }

  onSourceIdOpenedChange(opened: boolean): void {
    if (!opened) {
      this.sourceIdSearchCtrl.setValue('');
      this.sourceIdError = !this.selectedSourceId ? 'Source ID is required' : '';
    }
  }

  onTargetIdOpenedChange(opened: boolean): void {
    if (!opened) {
      this.targetIdSearchCtrl.setValue('');
      this.targetIdError = !this.selectedTargetId ? 'Target ID is required' : '';
    }
  }

  retrieve(): void {
    if (this.isRetrieveDisabled) return;

    this.isLoading = true;
    this.hasError = false;
    this.hasRetrieved = true;
    this.searchText = '';
    this.currentSearchKeyword = '';
    this.exitEditMode();

    this.conversionTableService.getConversionCodes(1000, 0, {
      sourceId: this.selectedSourceId,
      targetId: this.selectedTargetId,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allData = response.data;
          if (response.totalCount > response.data.length) {
            this.showError(`Displaying ${response.data.length} of ${response.totalCount} records. Please refine your search criteria.`);
          }
          this.applyClientSearch();
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
          this.showError('Failed to load conversion codes');
          this.cdr.markForCheck();
        }
      });
  }

  clearAll(): void {
    this.selectedSourceId = '';
    this.selectedTargetId = '';
    this.sourceIdError = '';
    this.targetIdError = '';
    this.allData = [];
    this.dataSource = [];
    this.totalCount = 0;
    this.hasRetrieved = false;
    this.hasError = false;
    this.currentSearchKeyword = '';
    this.sortDirection = '';
    this.exitEditMode();
  }

  enterEditMode(): void {
    this.isEditOrAddMode = true;
    this.newRows = [];
    this.editableRowsMeta = this.dataSource.map(row => this.createEditableRowMeta(row));
    this.loadEditDropdowns();
  }

  exitEditMode(): void {
    this.isEditOrAddMode = false;
    this.editableRowsMeta = [];
    this.newRows = [];
  }

  cancelEdit(): void {
    this.exitEditMode();
    this.searchText = '';
    this.currentSearchKeyword = '';
    this.applyClientSearch();
  }

  onTargetTypeChange(targetCodeType: string, rowEntry: NewRowEntry | EditableRowMeta): void {
    const targetValueCtrl = rowEntry.form.get('targetValue');
    targetValueCtrl?.setValue('');
    targetValueCtrl?.markAsDirty();
    targetValueCtrl?.markAsTouched();
    this.updateConvProcCallValidation(rowEntry.form, targetCodeType);
    if (!targetCodeType) {
      rowEntry.targetValueOptions = [];
      rowEntry.filteredTargetValueOptions = [];
      return;
    }
    this.conversionTableService.getTargetValueLookups(targetCodeType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          rowEntry.targetValueOptions = options;
          rowEntry.filteredTargetValueOptions = options;
          rowEntry.targetValueSearchCtrl.setValue('');
          this.cdr.markForCheck();
        },
        error: () => {
          rowEntry.targetValueOptions = [];
          rowEntry.filteredTargetValueOptions = [];
          this.showError('Failed to load target value options');
          this.cdr.markForCheck();
        }
      });
  }

  private updateConvProcCallValidation(form: FormGroup, targetCodeType: string): void {
    const convProcCallCtrl = form.get('convProcCall');
    if (!convProcCallCtrl) return;

    if (targetCodeType === 'PROC') {
      convProcCallCtrl.setValidators([Validators.required, Validators.pattern(/^\d{1,3}$/), Validators.min(0), Validators.max(999)]);
    } else {
      convProcCallCtrl.setValidators([Validators.pattern(/^\d{1,3}$/), Validators.min(0), Validators.max(999)]);
    }
    convProcCallCtrl.updateValueAndValidity();
    if (convProcCallCtrl.invalid) {
      convProcCallCtrl.markAsDirty();
      convProcCallCtrl.markAsTouched();
    }
  }

  private loadEditDropdowns(): void {
    this.lookupService.clearCache('IDPTP');
    this.lookupService.clearCache('IDPTV');

    forkJoin({
      sourceTypes: this.conversionTableService.getSourceTypeLookup(),
      targetTypes: this.conversionTableService.getTargetTypeLookup()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ sourceTypes, targetTypes }) => {
          this.sourceTypeOptions = sourceTypes;
          this.targetTypeOptions = targetTypes;
          this.sourceTypeOptionsSignal.set(sourceTypes);
          this.targetTypeOptionsSignal.set(targetTypes);
          this.cdr.markForCheck();
        },
        error: () => { this.showError('Failed to load dropdown values'); this.cdr.markForCheck(); }
      });
  }

  addNewRow(): void {
    const form = this.createRowForm(undefined, true);
    const searchCtrl = new FormControl('', { nonNullable: true });
    const entry: NewRowEntry = {
      id: --this.newRowCounter,
      form,
      lastChangedDateField: null,
      targetValueOptions: [],
      filteredTargetValueOptions: [],
      targetValueSearchCtrl: searchCtrl,
      errors: {}
    };
    this.setupTargetValueSearch(searchCtrl, entry);
    this.setupDateFieldSubscriptions(form, entry);
    this.newRows.unshift(entry);
  }

  removeNewRow(index: number): void {
    this.newRows.splice(index, 1);
  }

  startEdit(_index: number): void {
    this.enterEditMode();
  }

  saveAll(): void {
    let hasErrors = false;

    const touchedNewRows = this.newRows.filter(r => r.form.dirty || r.form.touched);

    for (const row of touchedNewRows) {
      row.form.markAllAsTouched();
      DateFieldValidationUtility.clearOptionalDateErrors(row.form, 'termDate');
      this.syncDateErrorsToRow(row);
      this.validateRequiredFields(row);
      if (row.form.invalid) hasErrors = true;
    }

    for (const meta of this.editableRowsMeta) {
      if (!meta.form.dirty) continue;

      meta.form.markAllAsTouched();

      const termDateControl = meta.form.get('termDate');
      if (termDateControl) {
        termDateControl.clearValidators();
        termDateControl.setValidators([
          DateFieldValidationUtility.terminationDateNotPastValidator(this.headerService.chapterTimeZone())
        ]);
        termDateControl.updateValueAndValidity({ emitEvent: false });
      }

      DateFieldValidationUtility.clearOptionalDateErrors(meta.form, 'termDate');
      this.syncDateErrorsToRow(meta);
      this.validateRequiredFields(meta);
      this.validateDropdownOptions(meta);
      if (meta.form.invalid) hasErrors = true;
    }

    if (hasErrors) {
      this.cdr.markForCheck();
      return;
    }

    this.isSaving = true;

    const createRequests = touchedNewRows.map(row => {
      const dto = this.buildCreateDto(row.form);
      return this.conversionTableService.create(dto);
    });

    const updateRequests = this.editableRowsMeta
      .filter(meta => meta.form.dirty)
      .map(meta => {
        const dto = this.buildUpdateDto(meta.form);
        return this.conversionTableService.update(meta.originalRow.convRefId, dto);
      });

    const allRequests = [...createRequests, ...updateRequests];

    if (allRequests.length === 0) {
      this.exitEditMode();
      this.isSaving = false;
      return;
    }

    forkJoin(allRequests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.showSuccess('Conversion Codes updated successfully.');
          this.exitEditMode();
          this.retrieve();
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isSaving = false;
          const errorCode = error?.error?.errorCode || error?.error?.errorResponse?.errorCode || '';
          const errorText = error?.error?.errorResponse?.error || error?.error?.message || 'Failed to save records. Please try again.';
          const errorMsg = errorCode ? `${errorCode}: ${errorText}` : errorText;
          this.showError(errorMsg);
          this.cdr.markForCheck();
        }
      });
  }

  onSearch(searchText: string): void {
    this.currentSearchKeyword = searchText;
    if (this.hasRetrieved) {
      this.applyClientSearch();
    }
  }

  onSort(): void {
    if (!this.sortDirection) {
      this.sortDirection = 'A';
    } else if (this.sortDirection === 'A') {
      this.sortDirection = 'D';
    } else {
      this.sortDirection = '';
    }
    this.applyClientSearch();
  }

  getSortIcon(): string {
    if (!this.sortDirection) return 'unfold_more';
    return this.sortDirection === 'A' ? 'arrow_upward' : 'arrow_downward';
  }

  getAriaSort(): string {
    if (!this.sortDirection) return 'none';
    return this.sortDirection === 'A' ? 'ascending' : 'descending';
  }

  private applyClientSearch(): void {
    const keyword = this.currentSearchKeyword?.toLowerCase().trim();
    if (!keyword) {
      this.dataSource = [...this.allData];
    } else {
      this.dataSource = this.allData.filter(row =>
        (row.sourceCodeType?.toLowerCase().includes(keyword)) ||
        (row.sourceValue?.toLowerCase().includes(keyword))
      );
    }

    if (this.sortDirection) {
      const dir = this.sortDirection === 'A' ? 1 : -1;
      this.dataSource.sort((a, b) => {
        const valA = (a.sourceCodeType || '').toLowerCase();
        const valB = (b.sourceCodeType || '').toLowerCase();
        return valA < valB ? -dir : valA > valB ? dir : 0;
      });
    }

    this.totalCount = this.dataSource.length;
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    return moment(date).format('DD-MMM-YYYY').toUpperCase();
  }

  isDateFieldInvalid(form: FormGroup, fieldName: 'effDate' | 'termDate', lastChanged: 'effective' | 'termination' | null): boolean {
    const control = form.get(fieldName);
    if (!control || !control.touched) return false;

    if (fieldName === 'effDate') {
      const hasOwnErrors = control.hasError('matDatepickerParse') || control.hasError('effectiveDatePast') || control.hasError('required');
      const hasRangeError = form.hasError('dateRangeInvalid') && lastChanged === 'effective';
      return hasOwnErrors || hasRangeError;
    } else {
      const hasOwnErrors = control.hasError('matDatepickerParse') || control.hasError('terminationDatePast') || control.hasError('required');
      const hasMinError = control.hasError('matDatepickerMin') && lastChanged !== 'effective';
      const hasRangeError = form.hasError('dateRangeInvalid') && lastChanged === 'termination';
      return hasOwnErrors || hasMinError || hasRangeError;
    }
  }

  getEffectiveDateError(form: FormGroup, lastChanged: 'effective' | 'termination' | null): string {
    const formErrors = lastChanged === 'effective' ? form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      form.get('effDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(form: FormGroup, lastChanged: 'effective' | 'termination' | null): string {
    const formErrors = lastChanged === 'termination' ? form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      form.get('termDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  getEffectiveDateMin(): Moment {
    return DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone() || 'UTC');
  }

  getTerminationMinDate(form: FormGroup): Moment | null {
    const effectiveDate = form.get('effDate')?.value;
    const today = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());

    if (!effectiveDate) {
      return today;
    }

    const effDate = moment.isMoment(effectiveDate) ? effectiveDate : moment(effectiveDate);
    const effDay = moment(effDate).startOf('day');

    return effDay.isBefore(today) ? today : effDay;
  }

  onDigitOnly(event: KeyboardEvent): void {
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onEffectiveDateInput(event: Event, rowEntry: NewRowEntry | EditableRowMeta): void {
    const value = (event.target as HTMLInputElement).value;
    const control = rowEntry.form.get('effDate');
    DateFieldValidationUtility.handleStartDateInput(value, control);
    if (value && value.length >= 5) {
      control?.markAsTouched();
      rowEntry.lastChangedDateField = 'effective';
      this.cdr.markForCheck();
    }
  }

  onTerminationDateInput(event: Event, rowEntry: NewRowEntry | EditableRowMeta, isEdit: boolean): void {
    const value = (event.target as HTMLInputElement).value;
    const control = rowEntry.form.get('termDate');
    DateFieldValidationUtility.handleEndDateInput(value, control, isEdit);
    if (value && value.length >= 5) {
      control?.markAsTouched();
      rowEntry.lastChangedDateField = 'termination';
      this.cdr.markForCheck();
    }
  }

  onDateChange(rowEntry: NewRowEntry | EditableRowMeta, fieldName: 'effDate' | 'termDate'): void {
    rowEntry.lastChangedDateField = fieldName === 'effDate' ? 'effective' : 'termination';
    const control = rowEntry.form.get(fieldName);
    if (control && control.hasError('matDatepickerParse')) {
      const errors = { ...control.errors };
      delete errors['matDatepickerParse'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
    delete rowEntry.errors[fieldName];
    this.cdr.markForCheck();
    setTimeout(() => {
      const active = document.activeElement as HTMLElement;
      if (active) active.blur();
    }, 100);
  }

  onDateInputBlur(event: Event, rowEntry: NewRowEntry | EditableRowMeta, fieldName: 'effDate' | 'termDate'): void {
    const control = rowEntry.form.get(fieldName);
    if (!control) return;

    const input = event.target as HTMLInputElement;
    const inputValue = input.value.trim();

    if (control.dirty) {
      rowEntry.lastChangedDateField = fieldName === 'effDate' ? 'effective' : 'termination';
    }

    control.markAsTouched();

    if (!inputValue) {
      control.setValue(null, { emitEvent: false });
      if (control.hasError('matDatepickerParse')) {
        const currentErrors = { ...control.errors };
        delete currentErrors['matDatepickerParse'];
        control.setErrors(Object.keys(currentErrors).length > 0 ? currentErrors : null);
      }
      delete rowEntry.errors[fieldName];
      return;
    }

    const parsedDate = moment(inputValue, ['DD-MMM-YYYY', 'D-MMM-YYYY'], true);

    if (!parsedDate.isValid()) {
      control.setErrors({ matDatepickerParse: true });
      control.markAsTouched();
      rowEntry.errors[fieldName] = 'Invalid date format';
    } else {
      control.setValue(parsedDate, { emitEvent: false });
      if (control.hasError('matDatepickerParse')) {
        const currentErrors = { ...control.errors };
        delete currentErrors['matDatepickerParse'];
        control.setErrors(Object.keys(currentErrors).length > 0 ? currentErrors : null);
      }
      control.updateValueAndValidity({ emitEvent: false });
      delete rowEntry.errors[fieldName];
    }
    this.cdr.markForCheck();
  }

  private syncDateErrorsToRow(rowEntry: NewRowEntry | EditableRowMeta): void {
    const form = rowEntry.form;
    const lastChanged = rowEntry.lastChangedDateField;

    const effDateControl = form.get('effDate');
    if (effDateControl && effDateControl.invalid && (effDateControl.touched || effDateControl.dirty)) {
      const errorMessage = this.getEffectiveDateError(form, lastChanged);
      if (errorMessage) {
        rowEntry.errors['effDate'] = errorMessage;
      } else {
        delete rowEntry.errors['effDate'];
      }
    } else if (form.hasError('dateRangeInvalid') && lastChanged === 'effective' && (effDateControl?.touched || effDateControl?.dirty)) {
      rowEntry.errors['effDate'] = 'Effective Date must be less than or equal to Termination Date';
      delete rowEntry.errors['termDate'];
    } else {
      delete rowEntry.errors['effDate'];
    }

    const termDateControl = form.get('termDate');
    if (termDateControl && termDateControl.invalid && (termDateControl.touched || termDateControl.dirty)) {
      const errorMessage = this.getTerminationDateError(form, lastChanged);
      if (errorMessage) {
        rowEntry.errors['termDate'] = errorMessage;
      } else {
        delete rowEntry.errors['termDate'];
      }
    } else if (form.hasError('dateRangeInvalid') && lastChanged === 'termination' && (termDateControl?.touched || termDateControl?.dirty)) {
      rowEntry.errors['termDate'] = 'Termination Date must be greater than or equal to Effective Date';
      delete rowEntry.errors['effDate'];
    } else {
      delete rowEntry.errors['termDate'];
    }
  }

  private validateRequiredFields(rowEntry: NewRowEntry | EditableRowMeta): void {
    const requiredFields = ['sourceCodeType', 'sourceValue', 'targetCodeType', 'targetValue'];
    for (const fieldName of requiredFields) {
      const control = rowEntry.form.get(fieldName);
      if (control && (!control.value || control.value.toString().trim() === '')) {
        control.setErrors({ ...(control.errors || {}), required: true });
        control.markAsTouched();
        control.markAsDirty();
      }
    }

    const targetCodeType = rowEntry.form.get('targetCodeType')?.value;
    if (targetCodeType === 'PROC') {
      const convProcCall = rowEntry.form.get('convProcCall');
      if (convProcCall && (convProcCall.value === null || convProcCall.value === '')) {
        convProcCall.setErrors({ ...(convProcCall.errors || {}), required: true });
        convProcCall.markAsTouched();
        convProcCall.markAsDirty();
      }
    }
  }

  private validateDropdownOptions(meta: EditableRowMeta): void {
    const targetValueCtrl = meta.form.get('targetValue');
    if (targetValueCtrl?.value && meta.targetValueOptions.length > 0 &&
        !meta.targetValueOptions.some(opt => opt.code === targetValueCtrl.value)) {
      targetValueCtrl.setErrors({ ...(targetValueCtrl.errors || {}), invalidOption: true });
      targetValueCtrl.markAsTouched();
      targetValueCtrl.markAsDirty();
    }
  }

  private buildCreateDto(form: FormGroup): CreateIdpConvRefValueDto {
    const formValue = form.getRawValue();
    const dto: CreateIdpConvRefValueDto = {
      sourceId: this.selectedSourceId,
      targetId: this.selectedTargetId,
      sourceCodeType: formValue.sourceCodeType || '',
      sourceValue: formValue.sourceValue || '',
      targetCodeType: formValue.targetCodeType || '',
      targetValue: formValue.targetValue || '',
    };
    if (formValue.effDate) {
      dto.effDate = moment(formValue.effDate).format('YYYY-MM-DD');
    }
    if (formValue.termDate) {
      dto.termDate = moment(formValue.termDate).format('YYYY-MM-DD');
    }
    if (formValue.convProcCall != null && formValue.convProcCall !== '') {
      dto.convProcCall = Number(formValue.convProcCall);
    }
    return dto;
  }

  private buildUpdateDto(form: FormGroup): UpdateIdpConvRefValueDto {
    const formValue = form.getRawValue();
    const dto: UpdateIdpConvRefValueDto = {
      sourceCodeType: formValue.sourceCodeType || '',
      sourceValue: formValue.sourceValue || '',
      targetCodeType: formValue.targetCodeType || '',
      targetValue: formValue.targetValue || '',
    };
    if (formValue.effDate) {
      dto.effDate = moment(formValue.effDate).format('YYYY-MM-DD');
    }
    if (formValue.termDate) {
      dto.termDate = moment(formValue.termDate).format('YYYY-MM-DD');
    }
    if (formValue.convProcCall != null && formValue.convProcCall !== '') {
      dto.convProcCall = Number(formValue.convProcCall);
    }
    return dto;
  }

  private createRowForm(row?: IdpConvRefValueDto, isNew = false): FormGroup {
    const isProcType = row?.targetCodeType === 'PROC';
    const convProcValidators = isProcType
      ? [Validators.required, Validators.pattern(/^\d{1,3}$/), Validators.min(0), Validators.max(999)]
      : [Validators.pattern(/^\d{1,3}$/), Validators.min(0), Validators.max(999)];

    const form = new FormGroup({
      sourceCodeType: new FormControl(row?.sourceCodeType || '', Validators.required),
      sourceValue: new FormControl(row?.sourceValue || '', [Validators.required, Validators.maxLength(20)]),
      targetCodeType: new FormControl(row?.targetCodeType || '', Validators.required),
      targetValue: new FormControl(row?.targetValue || '', Validators.required),
      convProcCall: new FormControl<string | null>(row?.convProcCall != null ? String(row.convProcCall) : null, convProcValidators),
      effDate: new FormControl<Moment | null>(
        row?.effDate ? moment(row.effDate) : isNew ? DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone()) : null
      ),
      termDate: new FormControl<Moment | null>(
        row?.termDate ? moment(row.termDate) : null
      )
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });

    if (isNew) {
      DateFieldValidationUtility.setupAddModeValidators(form, this.headerService.chapterTimeZone());
      const effDateControl = form.get('effDate');
      if (effDateControl) {
        effDateControl.clearValidators();
        effDateControl.setValidators([
          DateFieldValidationUtility.effectiveDateNotPastValidator(this.headerService.chapterTimeZone())
        ]);
        effDateControl.updateValueAndValidity();
      }
    } else {
      this.setupEditModeValidatorsCustom(form, row);
    }

    if (!isNew) {
      form.markAsPristine();
      form.markAsUntouched();
    }

    return form;
  }

  private setupEditModeValidatorsCustom(form: FormGroup, row?: IdpConvRefValueDto): void {
    const effDateControl = form.get('effDate');
    if (effDateControl) {
      effDateControl.clearValidators();
      effDateControl.disable();
      effDateControl.updateValueAndValidity();
    }

    const termDateControl = form.get('termDate');
    if (termDateControl) {
      const originalTermDate = row?.termDate ? moment(row.termDate).format('YYYY-MM-DD') : null;
      termDateControl.clearValidators();
      termDateControl.setValidators([
        DateFieldValidationUtility.editModeTerminationDateValidator(originalTermDate, this.headerService.chapterTimeZone())
      ]);
      termDateControl.updateValueAndValidity();
    }
  }

  private createEditableRowMeta(row: IdpConvRefValueDto): EditableRowMeta {
    const form = this.createRowForm(row, false);
    const searchCtrl = new FormControl('', { nonNullable: true });
    const meta: EditableRowMeta = {
      form, originalRow: row, lastChangedDateField: null,
      targetValueOptions: [], filteredTargetValueOptions: [],
      targetValueSearchCtrl: searchCtrl, errors: {}
    };
    this.setupTargetValueSearch(searchCtrl, meta);
    this.setupDateFieldSubscriptions(form, meta);
    if (row.targetCodeType) {
      this.conversionTableService.getTargetValueLookups(row.targetCodeType)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (options) => {
            meta.targetValueOptions = options;
            meta.filteredTargetValueOptions = options;
            searchCtrl.setValue('');
            const targetValueCtrl = meta.form.get('targetValue');
            const currentValue = targetValueCtrl?.value;
            if (currentValue && options.length > 0 && !options.some(opt => opt.code === currentValue)) {
              targetValueCtrl?.setValue('', { emitEvent: false });
            }
            this.cdr.markForCheck();
          },
          error: () => {
            meta.targetValueOptions = [];
            meta.filteredTargetValueOptions = [];
            this.cdr.markForCheck();
          }
        });
    }
    return meta;
  }

  private setupTargetValueSearch(searchCtrl: FormControl<string>, entry: NewRowEntry | EditableRowMeta): void {
    searchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        entry.filteredTargetValueOptions = !term
          ? entry.targetValueOptions
          : entry.targetValueOptions.filter(o => o.code.toLowerCase().includes(term) || o.description?.toLowerCase().includes(term));
      });
  }

  private setupDateFieldSubscriptions(_form: FormGroup, _tracker: NewRowEntry | EditableRowMeta): void {
  }


  getFieldErrorTooltip(form: FormGroup, fieldName: string, label: string, showWhenFormDirty = false): string {
    const control = form.get(fieldName);
    if (!control || !control.invalid) return '';
    if (!control.touched && !(showWhenFormDirty && form.dirty)) return '';
    if (control.hasError('required')) return `${label} is required`;
    if (control.hasError('invalidOption')) return `${label} has an invalid selection`;
    if (control.hasError('min')) return `${label} must be 0 or greater`;
    return '';
  }

  getEffectiveDateTooltipMessage(form: FormGroup, lastChanged: 'effective' | 'termination' | null): string {
    const control = form.get('effDate');
    if (!control) return '';

    if (control.touched && (control.invalid || form.hasError('dateRangeInvalid'))) {
      if (control.hasError('matDatepickerParse')) return 'Effective Date is invalid';
      if (control.hasError('invalidDateFormat') || control.hasError('invalidDate')) return 'Effective Date is invalid';
      if (control.hasError('effectiveDatePast')) return 'Effective Date cannot be past date';
      if (form.hasError('dateRangeInvalid') && lastChanged === 'effective') {
        return 'Effective Date must be less than or equal to Termination Date';
      }
    }

    if (!control.value) return 'Optional. Use format DD-MMM-YYYY (e.g., 12-MAR-2025)';
    return '';
  }

  getTerminationDateTooltipMessage(form: FormGroup, lastChanged: 'effective' | 'termination' | null): string {
    const control = form.get('termDate');
    if (!control) return '';

    if (control.touched && (control.invalid || form.hasError('dateRangeInvalid'))) {
      if (control.hasError('matDatepickerParse')) return 'Termination Date is invalid';
      if (control.hasError('invalidDateFormat') || control.hasError('invalidDate')) return 'Termination Date is invalid';
      if (control.hasError('terminationDatePast')) return 'Termination Date cannot be past date';
      if (control.hasError('matDatepickerMin') && lastChanged === 'termination') {
        return 'Termination Date must be greater than or equal to Effective Date';
      }
      if (form.hasError('dateRangeInvalid') && lastChanged === 'termination') {
        return 'Termination Date must be greater than or equal to Effective Date';
      }
    }

    if (!control.value) return 'Optional. Use format DD-MMM-YYYY (e.g., 12-MAR-2025)';
    return '';
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
