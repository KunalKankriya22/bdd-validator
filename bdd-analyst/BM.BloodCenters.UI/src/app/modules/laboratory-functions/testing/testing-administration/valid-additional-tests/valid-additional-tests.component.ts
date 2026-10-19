import { Component, OnInit, OnDestroy, inject, effect, ViewChild, ElementRef } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import moment from 'moment';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';

import { ValidAdditionalTestsApiService } from './services/valid-additional-tests-api.service';
import { ValidAdditionalTestsFilterPanelComponent } from './valid-additional-tests-filter-panel/valid-additional-tests-filter-panel.component';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import {
  ValidAdditionalTestDto,
  ValidAdditionalTestFilterValue,
  ValidAdditionalTestQueryDto,
  ValidTestDropdownDto,
  CreateValidAdditionalTestRequestDto,
  UpdateValidAdditionalTestRequestDto,
} from './models/valid-additional-tests.model';

interface NewRowEntry {
  id: number;
  form: FormGroup;
  terminationDateFilter: (date: moment.Moment | null) => boolean;
}

interface EditableRowMeta {
  form: FormGroup;
  originalRow: ValidAdditionalTestDto;
  terminationDateFilter: (date: moment.Moment | null) => boolean;
}

interface LookUp {
  key: string;
  value: string;
}

@Component({
  selector: 'app-valid-additional-tests',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    FilterChips,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './valid-additional-tests.component.html',
  styleUrls: ['./valid-additional-tests.component.scss'],
})
export class ValidAdditionalTestsComponent implements OnInit, OnDestroy {
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ValidAdditionalTestsApiService);
  private readonly overlay = inject(Overlay);
  private readonly headerService = inject(HeaderService);
  private readonly menuService = inject(MenuService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();
  private readonly overlayClose$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  headerConfig: PageHeaderConfig = { breadcrumbs: [] };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by test ID',
    minLength: 2,
    ariaLabel: 'Search by test ID',
    searchOnEnterOnly: true,
  };

  filterForm!: FormGroup;

  filterTestOptions: LookUp[] = [];
  filteredFilterTestOptions: LookUp[] = [];
  filterTestSearchCtrl = new FormControl('');

  testIdOptions: LookUp[] = [];
  filteredTestIdOptions: LookUp[] = [];
  testIdFilterCtrl = new FormControl('');

  dataSource: ValidAdditionalTestDto[] = [];
  filteredDataSource: ValidAdditionalTestDto[] = [];
  searchText = '';
  testIdSortDirection: 'asc' | 'desc' = 'asc';

  isLoading = false;
  hasError = false;
  errorMessage = '';
  isFilterOpen = false;
  appliedFilters: ValidAdditionalTestFilterValue | null = null;
  filterChips: FilterChip[] = [];
  isEditOrAddMode = false;
  showValidationError = false;
  hasAnyDirtyForms = false;
  hasAnyInvalidForms = false;
  isSaving = false;

  editableRowsMeta: EditableRowMeta[] = [];
  newRows: NewRowEntry[] = [];
  private newRowCounter = 0;

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  get minDate() {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  get currentFilterTestId(): string {
    return this.filterForm?.get('testId')?.value || '';
  }

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();
      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.ValidAdditionalTests]?.path;
        if (basePath) {
          const menuItem = this.menuService.findMenuItemByPath(basePath);
          if (menuItem) {
            this.headerConfig = {
              ...this.headerConfig,
              breadcrumbs: [
                { label: 'Home', link: '/home' },
                { label: menuItem.label, link: null },
              ],
              title: menuItem.label,
              subtitle: menuItem.remarks || menuItem.subtitle || 'Define additional tests that can be included in remote sample files.',
            };
          }
        }
      }
    });
  }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      testId: [''],
      description: [{ value: '', disabled: true }],
    });

    this.filterForm.get('testId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((testId: string) => {
        if (this.isEditOrAddMode) this.exitEditMode();
        this.onFilterTestIdChange(testId);
      });

    this.loadDropdownOptions();
    this.setupSearchFilters();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.overlayClose$.complete();
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.exitEditMode();
        this.filterForm.patchValue({ testId: '', description: '' }, { emitEvent: false });
        this.dataSource = [];
        this.filteredDataSource = [];
        this.searchText = '';
        this.loadDropdownOptions();
      });
  }

  private loadDropdownOptions(): void {
    this.service.getTestsDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tests) => {
          const options: LookUp[] = tests.map(t => ({ key: t.testId, value: t.testDesc }));
          this.filterTestOptions = options;
          this.filteredFilterTestOptions = [...options];
          this.testIdOptions = options;
          this.filteredTestIdOptions = [...options];
        },
        error: () => {
          this.snackbarService.showError('Failed to load test options');
        },
      });
  }

  private setupSearchFilters(): void {
    this.filterTestSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredFilterTestOptions = this.filterTestOptions.filter(o =>
          o.key.toLowerCase().includes(term) || o.value.toLowerCase().includes(term)
        );
      });

    this.testIdFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredTestIdOptions = this.testIdOptions.filter(o =>
          o.key.toLowerCase().includes(term) || o.value.toLowerCase().includes(term)
        );
      });
  }

  private onFilterTestIdChange(testId: string): void {
    const option = this.filterTestOptions.find(o => o.key === testId);
    this.filterForm.get('description')?.setValue(option?.value || '-', { emitEvent: false });
    if (testId) {
      this.loadTableData();
    } else {
      this.dataSource = [];
      this.filteredDataSource = [];
    }
  }

  onClear(): void {
    if (this.isEditOrAddMode) this.exitEditMode();
    this.filterForm.patchValue({ testId: '', description: '' }, { emitEvent: false });
    this.dataSource = [];
    this.filteredDataSource = [];
    this.searchText = '';
  }

  loadTableData(): void {
    this.isLoading = true;
    this.hasError = false;

    const queryDto: ValidAdditionalTestQueryDto = {};

    const selectedTestId = this.currentFilterTestId;
    if (selectedTestId) {
      queryDto.testId = selectedTestId;
    }

    if (this.searchText) {
      queryDto.searchKeyword = this.searchText;
    }

    if (this.appliedFilters) {
      if (this.appliedFilters.effDateFrom) {
        queryDto.effDatePeriod = this.appliedFilters.effectivePeriod || 'After';
        queryDto.effectiveDate = DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.effDateFrom) || undefined;
      }
      if (this.appliedFilters.effDateTo) {
        queryDto.termDatePeriod = this.appliedFilters.terminationPeriod || 'Before';
        queryDto.terminationDate = DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.effDateTo) || undefined;
      }
    }

    this.service.getAll(1000, 0, queryDto)
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
          this.errorMessage = 'Failed to load data. Please try again.';
        },
      });
  }

  onSearch(searchText: string): void {
    this.searchText = searchText;
    this.loadTableData();
  }

  toggleTestIdSort(): void {
    this.testIdSortDirection = this.testIdSortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.dataSource];

    const selectedTestId = this.currentFilterTestId;
    if (selectedTestId) {
      filtered = filtered.filter(item => item.testId === selectedTestId);
    }

    const dir = this.testIdSortDirection === 'asc' ? 1 : -1;
    filtered.sort((a, b) => a.testId.localeCompare(b.testId) * dir);

    this.filteredDataSource = filtered;
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
        });

      meta.form.get('effDate')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          meta.form.get('termDate')?.updateValueAndValidity({ emitEvent: false });
          this.updateDirtyFormsFlag();
        });

      meta.form.get('termDate')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.updateDirtyFormsFlag();
        });
    });

    if (this.filteredDataSource.length === 0) {
      this.addNewRow();
    }

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
    };

    form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateDirtyFormsFlag());

    form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        form.get('termDate')?.updateValueAndValidity({ emitEvent: false });
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
          const option = this.testIdOptions.find(t => t.key === testId);
          form.get('description')?.setValue(option?.value || '', { emitEvent: false });
        } else {
          form.get('description')?.setValue('', { emitEvent: false });
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

    if (this.hasDuplicateTestIds()) {
      return;
    }

    this.showValidationError = false;
    this.isSaving = true;

    const createDtos = this.newRows
      .filter(r => r.form.dirty || r.form.touched)
      .map(r => this.formToCreateDto(r.form));

    const updateDtos = this.editableRowsMeta
      .filter(m => m.form.dirty)
      .map(m => ({
        testId: m.originalRow.testId,
        dto: this.formToUpdateDto(m.form),
      }));

    const createObs = createDtos.map(dto => this.service.create(dto));
    const updateObs = updateDtos.map(item => this.service.update(item.testId, item.dto));
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
          this.snackbarService.showSuccess('Tests updated successfully.');
          this.isSaving = false;
          this.exitEditMode();
          this.loadDropdownOptions();
          this.loadTableData();
        },
        error: (error) => {
          this.isSaving = false;
          const msg = error?.error?.errorResponse?.error || error?.error?.message || 'Failed to save changes.';
          this.snackbarService.showError(msg);
        },
      });
  }

  private createRowForm(row?: ValidAdditionalTestDto, isNew = false): FormGroup {
    const form = this.fb.group({
      testId: [{ value: row?.testId || '', disabled: !isNew }, Validators.required],
      description: [{ value: row?.testDesc || '', disabled: true }],
      effDate: [row?.effDate ? moment(row.effDate) : null],
      termDate: [row?.termDate ? moment(row.termDate) : null],
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()],
    });

    if (isNew) {
      form.get('effDate')?.setValidators([
        Validators.required,
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.effectiveDateNotPastValidator(this.chapterOffset),
      ]);
      form.get('termDate')?.setValidators([
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset),
      ]);
    } else {
      form.get('effDate')?.setValidators([
        Validators.required,
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
      ]);
      form.get('termDate')?.setValidators([
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
      ]);
    }

    form.get('effDate')?.updateValueAndValidity();
    form.get('termDate')?.updateValueAndValidity();

    return form;
  }

  private createEditableRowMeta(row: ValidAdditionalTestDto): EditableRowMeta {
    const form = this.createRowForm(row, false);
    const terminationDateFilter = (date: moment.Moment | null): boolean => {
      if (!date) return true;
      const effDate = form.get('effDate')?.value;
      if (!effDate) return true;
      const effMoment = moment.isMoment(effDate) ? effDate : moment(effDate);
      return date.isSameOrAfter(effMoment, 'day');
    };
    return { form, originalRow: row, terminationDateFilter };
  }

  private formToCreateDto(form: FormGroup): CreateValidAdditionalTestRequestDto {
    const value = form.getRawValue();
    return {
      testId: value.testId,
      effDate: DateFieldValidationUtility.serializeDateForApi(value.effDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(value.termDate) || undefined,
    };
  }

  private formToUpdateDto(form: FormGroup): UpdateValidAdditionalTestRequestDto {
    const value = form.getRawValue();
    return {
      effDate: DateFieldValidationUtility.serializeDateForApi(value.effDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(value.termDate) || null,
    };
  }

  private updateDirtyFormsFlag(): void {
    this.hasAnyDirtyForms = this.newRows.some(r => r.form.dirty || r.form.touched)
      || this.editableRowsMeta.some(r => r.form.dirty);

    const newRowsInvalid = this.newRows.some(r => {
      if (!r.form.dirty && !r.form.touched) return false;
      return r.form.invalid;
    });

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

  private hasDuplicateTestIds(): boolean {
    const newTestIds = this.newRows
      .filter(r => r.form.dirty || r.form.touched)
      .map(r => r.form.getRawValue().testId)
      .filter(Boolean);

    const existingTestIds = this.editableRowsMeta.map(m => m.originalRow.testId);
    const allTestIds = [...existingTestIds, ...newTestIds];

    const seen = new Set<string>();
    for (const id of allTestIds) {
      if (seen.has(id)) {
        this.snackbarService.showError(`Duplicate Test ID "${id}" found. Each test can only be added once.`);
        return true;
      }
      seen.add(id);
    }
    return false;
  }

  private hasValidationErrors(): boolean {
    const newRowErrors = this.newRows.some(r => r.form.invalid && (r.form.dirty || r.form.touched));
    const editRowErrors = this.editableRowsMeta.some(r => {
      if (!r.form.dirty) return false;
      const hasDirtyInvalidControl = Object.keys(r.form.controls).some(key => {
        const ctrl = r.form.get(key);
        return ctrl != null && ctrl.dirty && ctrl.invalid;
      });
      return hasDirtyInvalidControl || (r.form.errors != null);
    });
    return newRowErrors || editRowErrors;
  }

  private markAllFormsAsTouched(): void {
    this.newRows.forEach(r => r.form.markAllAsTouched());
    this.editableRowsMeta
      .filter(m => m.form.dirty)
      .forEach(m => m.form.markAllAsTouched());
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  hasDateError(form: FormGroup, fieldName: 'effDate' | 'termDate'): boolean {
    return !!this.getDateErrorMessage(form, fieldName);
  }

  getDateErrorMessage(form: FormGroup, fieldName: 'effDate' | 'termDate'): string {
    return fieldName === 'effDate'
      ? DateFieldValidationUtility.getEffectiveDateError(form)
      : DateFieldValidationUtility.getTerminationDateError(form);
  }

  getRequiredFieldError(form: FormGroup, controlName: string, label: string): string {
    const control = form.get(controlName);
    if (control && control.hasError('required') && (control.dirty || control.touched)) {
      return `${label} is required`;
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

  onTestIdPanelToggle(opened: boolean): void {
    if (opened) {
      this.testIdFilterCtrl.setValue('');
      this.filteredTestIdOptions = [...this.testIdOptions];
    }
  }

  // ── Filter Panel ──

  openFilter(): void {
    if (this.overlayRef) {
      this.closeOverlay();
      return;
    }

    this.isFilterOpen = true;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.tableCard)
      .withPositions([{
        originX: 'start', originY: 'top',
        overlayX: 'start', overlayY: 'top',
        offsetX: 0, offsetY: 56,
      }])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    const portal = new ComponentPortal(ValidAdditionalTestsFilterPanelComponent);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply.pipe(takeUntil(this.overlayClose$)).subscribe((filters) => {
      this.applyPanelFilters(filters);
      this.closeOverlay();
    });

    componentRef.instance.close.pipe(takeUntil(this.overlayClose$)).subscribe(() => {
      this.closeOverlay();
    });

    this.overlayRef.backdropClick().pipe(takeUntil(this.overlayClose$)).subscribe(() => {
      this.closeOverlay();
    });
  }

  private closeOverlay(): void {
    this.overlayClose$.next();
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
  }

  private applyPanelFilters(filters: ValidAdditionalTestFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = this.buildFilterChips(filters);
    this.loadTableData();
  }

  onRemoveFilterChip(chipKey: string): void {
    if (!this.appliedFilters) return;

    if (chipKey === 'effectiveDate') {
      this.appliedFilters = { ...this.appliedFilters, effDateFrom: null, effectivePeriod: null };
    } else if (chipKey === 'terminationDate') {
      this.appliedFilters = { ...this.appliedFilters, effDateTo: null, terminationPeriod: null };
    }

    this.filterChips = this.buildFilterChips(this.appliedFilters);
    this.loadTableData();
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.loadTableData();
  }

  hasActiveFilters(): boolean {
    return this.filterChips.length > 0;
  }

  private buildFilterChips(filters: ValidAdditionalTestFilterValue | null): FilterChip[] {
    if (!filters) return [];
    const chips: FilterChip[] = [];

    if (filters.effDateFrom) {
      const period = filters.effectivePeriod || 'After';
      const symbol = period === 'Before' ? '≤' : '≥';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${this.formatDate(DateFieldValidationUtility.serializeDateForApi(filters.effDateFrom))}`,
        value: filters.effDateFrom,
      });
    }

    if (filters.effDateTo) {
      const period = filters.terminationPeriod || 'Before';
      const symbol = period === 'Before' ? '≤' : '≥';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${this.formatDate(DateFieldValidationUtility.serializeDateForApi(filters.effDateTo))}`,
        value: filters.effDateTo,
      });
    }

    return chips;
  }
}
