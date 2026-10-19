import { Component, OnInit, OnDestroy, ViewChild, inject, ChangeDetectorRef, effect, computed, EffectRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent, TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { MatDialog } from '@angular/material/dialog';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MenuService } from '@shared/services/menu.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import moment, { Moment } from 'moment';
import { OverlayModule } from '@angular/cdk/overlay';
import { A11yModule } from '@angular/cdk/a11y';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { Observable, Subject, of, takeUntil, startWith, map, distinctUntilChanged } from 'rxjs';

import { FastTrakWebConfigurationService } from './services/fasttrak-web-configuration.service';
import { ResourceFilterComponent, ResourceFilter } from './filter/resource-filter';
import { ResourceFilterChipsUtils } from './utils/filter-chips.utils';
import {
  ValidHHResource,
  CodeLookup,
  AddValidHHResourceRequest,
  UpdateValidHHResourceRequest,
  RetrieveValidHHResourceConfigRequest,
  SaveDonorResponseConfigRequest
} from './models/fasttrak-web-configuration.model';
import { AddEditResourceDialog, ResourceDialogData, ResourceDialogResult } from './add-edit-resource-dialog/add-edit-resource-dialog';

interface TypeOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-fasttrak-web-configuration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    NgxMatSelectSearchModule,
    OverlayModule,
    A11yModule,
    DataTable,
    PageHeaderWithBreadcrumb,
    ResourceFilterComponent,
    FilterChips
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './fasttrak-web-configuration.html',
  styleUrls: ['./fasttrak-web-configuration.scss']
})
export class FastTrakWebConfiguration implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private service = inject(FastTrakWebConfigurationService);
  private headerService = inject(HeaderService);
  private menuService = inject(MenuService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private snackbarService = inject(SnackbarService);
  private destroy$ = new Subject<void>();

  // Page header configuration
  readonly headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'FastTrak Web Configuration', link: null }
    ]
  };

  // Page title and subtitle from menu API
  private readonly FASTTRAK_ROUTE_PATH = '/donor-functions/registration/registration-administration/fasttrak-web-configuration';
  private readonly DEFAULT_TITLE = 'FastTrak Web Configuration (Onsite)';
  private readonly DEFAULT_SUBTITLE = 'Manage informational documents and links associated with donor questionnaire pages or questions.';

  pageTitle = computed(() => {
    const menuItem = this.menuService.findMenuItemByPath(this.FASTTRAK_ROUTE_PATH);
    return menuItem?.label || this.DEFAULT_TITLE;
  });

  pageSubtitle = computed(() => {
    const menuItem = this.menuService.findMenuItemByPath(this.FASTTRAK_ROUTE_PATH);
    return menuItem?.subtitle || this.DEFAULT_SUBTITLE;
  });

  // --- Type Dropdown ---
  @ViewChild('typeSelect', { static: false }) typeSelect?: MatSelect;
  typeControl = new FormControl<string | null>(null);
  typeSearchControl = new FormControl('');
  typeOptions: TypeOption[] = [
    { value: 'Question', label: 'Question' },
    { value: 'Other', label: 'Other' }
  ];
  filteredTypeOptions$!: Observable<TypeOption[]>;

  // --- Code Dropdown ---
  @ViewChild('codeSelect', { static: false }) codeSelect?: MatSelect;
  codeControl = new FormControl<CodeLookup | null>(null);
  codeSearchControl = new FormControl('');
  codeLookupList: CodeLookup[] = [];
  filteredCodes$: Observable<CodeLookup[]> = of([]);
  isLoadingCodes = false;

  // --- Donor Response Form ---
  donorResponseForm!: FormGroup;

  // --- Data ---
  validHHResources: ValidHHResource[] = [];
  filteredResources: ValidHHResource[] = [];
  allResources: ValidHHResource[] = [];
  selectedCodeDetail = '';

  // --- Filter State ---
  appliedResourceFilters: ResourceFilter | null = null;
  filterChips: FilterChip[] = [];
  isFilterOpen = false;

  // Resource Table Config
  resourceTableConfig: DataTableConfig<ValidHHResource> = {
    columns: [
      { key: 'code', header: 'Code', sortable: true, width: '10%' },
      { key: 'locationLink', header: 'Location Link', width: '26%', truncate: true, truncateLength: 60 },
      { key: 'description', header: 'Description', width: '30%', truncate: true, truncateLength: 60 },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        width: '15%',
        valueFormatter: (value: string) => this.formatDateForDisplay(value)
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        width: '15%',
        valueFormatter: (value: string) => value ? this.formatDateForDisplay(value) : ''
      }
    ],
    rowActions: [
      { icon: 'edit', label: 'Edit', action: 'edit' }
    ],
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No resources found',
    emptySubMessage: 'Configure the Resource Configuration and click Retrieve to view resources.',
    noDataIcon: 'search'
  };

  // Date restriction for datepickers
  minDate!: moment.Moment;
  minTermDate!: moment.Moment;

  // Tab State
  selectedTabIndex = 0;

  // UI State
  isLoading = false;
  isSaving = false;

  // Donor Response original values (for dirty checking)
  private donorResponseOriginalValues: {
    onlineResponsesFlag: boolean;
    multiLanguageFlag: boolean;
    effectiveDate: Moment | null;
    terminationDate: Moment | null;
    auditKey: number | null;
  } | null = null;

  isDonorResponseDirty = false;

  private _timezoneEffect!: EffectRef;
  private donorLastChangedDateField: 'effective' | 'termination' | null = null;
  private _loadedEffDateMin: moment.Moment | null = null;

  donorEffDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getDonorEffectiveDateError());
  donorTermDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getDonorTerminationDateError());

  donorTerminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    const today = this.minDate.clone().startOf('day');
    if (checkDate.isBefore(today)) return false;
    const eff = this.donorResponseForm?.get('effectiveDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) return false;
    }
    return true;
  };

  constructor() {
    this.updateMinDatesForChapterTimezone();

    this._timezoneEffect = effect(() => {
      const timezone = this.headerService.chapterTimeZone();
      this.updateMinDatesForChapterTimezone();
    });
  }

  private updateMinDatesForChapterTimezone(): void {
    const chapterTimezone = this.headerService.chapterTimeZone();
    const chapterMin = DateFieldValidationUtility.getMinDate(chapterTimezone);
    this.minDate = (this._loadedEffDateMin && this._loadedEffDateMin.isBefore(chapterMin, 'day'))
      ? this._loadedEffDateMin.clone()
      : chapterMin;
    this.minTermDate = DateFieldValidationUtility.getMinDate(chapterTimezone);
  }

  ngOnInit(): void {
    this.initializeForms();
    this.loadDonorResponseConfiguration();
    this.setupTypeFilter();
    this.setupDropdownSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Dropdown Setup ---

  private setupTypeFilter(): void {
    this.filteredTypeOptions$ = this.typeSearchControl.valueChanges.pipe(
      startWith(''),
      map(searchText => {
        const text = (searchText || '').toLowerCase();
        if (!text) return this.typeOptions;
        return this.typeOptions.filter(o =>
          o.label.toLowerCase().includes(text)
        );
      })
    );
  }

  private setupCodeFilter(): void {
    this.filteredCodes$ = this.codeSearchControl.valueChanges.pipe(
      startWith(''),
      map(searchText => {
        const text = (searchText || '').toLowerCase();
        if (!text) return this.codeLookupList;
        return this.codeLookupList.filter(o =>
          o.code.toLowerCase().includes(text) ||
          o.description.toLowerCase().includes(text)
        );
      })
    );
  }

  private setupDropdownSubscriptions(): void {
    this.typeControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => {
        if (type) {
          this.loadCodeLookup(type as 'Question' | 'Other');
        } else {
          this.codeLookupList = [];
          this.setupCodeFilter();
        }
        this.codeControl.setValue(null, { emitEvent: false });
        this.codeSearchControl.setValue('', { emitEvent: false });
        this.selectedCodeDetail = '';
      });

    this.codeControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(code => {
        this.selectedCodeDetail = code?.description || '';
      });
  }

  compareCode = (a: CodeLookup, b: CodeLookup): boolean => {
    return !!a && !!b && a.code === b.code;
  };

  onTypeSelectOpened(opened: boolean): void {
    if (opened && this.typeSelect) {
      this.typeSelect._keyManager?.setActiveItem(-1);
    }
  }

  onCodeSelectOpened(opened: boolean): void {
    if (opened && this.codeSelect) {
      this.codeSelect._keyManager?.setActiveItem(-1);
    }
  }

  // --- Forms ---

  private initializeForms(): void {
    this.donorResponseForm = this.fb.group({
      onlineResponsesFlag: [false],
      multiLanguageFlag: [false],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')
      ]
    });

    this.donorResponseForm.get('effectiveDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.donorLastChangedDateField = 'effective';
        this.updateDonorTermMinDate();
        this.isDonorResponseDirty = this.computeIsDirty();
      });

    this.donorResponseForm.get('terminationDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.donorLastChangedDateField = 'termination';
        this.isDonorResponseDirty = this.computeIsDirty();
      });

    this.donorResponseOriginalValues = {
      onlineResponsesFlag: false,
      multiLanguageFlag: false,
      effectiveDate: null,
      terminationDate: null,
      auditKey: null
    };
  }

  private updateDonorTermMinDate(): void {
    const effectiveValue = this.donorResponseForm?.get('effectiveDate')?.value;
    let effectiveMoment: moment.Moment | null = null;

    if (effectiveValue && moment.isMoment(effectiveValue) && effectiveValue.isValid()) {
      effectiveMoment = effectiveValue.clone();
    } else if (effectiveValue instanceof Date && !isNaN(effectiveValue.getTime())) {
      effectiveMoment = moment(effectiveValue);
    }

    if (effectiveMoment) {
      this.minTermDate = effectiveMoment.isAfter(this.minDate) ? effectiveMoment : this.minDate.clone();
    } else {
      this.minTermDate = this.minDate;
    }
  }

  private loadDonorResponseConfiguration(): void {
    this.service.getDonorResponseConfiguration()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          if (!config) return;

          // If the server-loaded effectiveDate is before today (a past date from an existing
          // configuration), lower minDate to match the loaded value so that the
          // MatDatepickerInput [min] validator does not mark the control—and therefore
          // the whole form—as invalid. The min-date constraint is preserved: users cannot
          // manually pick a date earlier than this adjusted minimum.
          const loadedEffDate = config.effectiveDate as moment.Moment | null;
          if (loadedEffDate && moment.isMoment(loadedEffDate) && loadedEffDate.isValid()) {
            const loadedDay = loadedEffDate.clone().startOf('day');
            if (loadedDay.isBefore(this.minDate, 'day')) {
              this._loadedEffDateMin = loadedDay;
              this.minDate = loadedDay;
            }
          }

          this.donorResponseForm.patchValue({
            onlineResponsesFlag: config.onlineResponsesFlag,
            multiLanguageFlag: config.multiLanguageFlag,
            effectiveDate: config.effectiveDate,
            terminationDate: config.terminationDate
          });
          this.donorResponseOriginalValues = {
            onlineResponsesFlag: config.onlineResponsesFlag,
            multiLanguageFlag: config.multiLanguageFlag,
            effectiveDate: config.effectiveDate ? (config.effectiveDate as moment.Moment).clone() : null,
            terminationDate: config.terminationDate ? (config.terminationDate as moment.Moment).clone() : null,
            auditKey: config.auditKey
          };
          this.donorResponseForm.markAsPristine();
          this.donorResponseForm.markAsUntouched();
          this.isDonorResponseDirty = false;
          // detectChanges updates [min]="minDate" binding on the datepicker input so
          // MatDatepickerInput._min reflects the adjusted minDate; then updateValueAndValidity
          // re-runs validators with the correct _min and the loaded effectiveDate value.
          this.cdr.detectChanges();
          this.donorResponseForm.get('effectiveDate')?.updateValueAndValidity({ emitEvent: false });
          this.cdr.detectChanges();
        },
        error: () => {}
      });
  }

  // --- Code Lookup ---

  private loadCodeLookup(type: 'Question' | 'Other'): void {
    this.isLoadingCodes = true;
    this.service.getResourceConfiguration()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.codeLookupList = type === 'Other' ? response.o : response.q;
          this.isLoadingCodes = false;
          this.setupCodeFilter();
          this.cdr.markForCheck();
        },
        error: () => {
          this.codeLookupList = [];
          this.isLoadingCodes = false;
          this.filteredCodes$ = of([]);
        }
      });
  }

  // --- Retrieve ---

  get isRetrieveEnabled(): boolean {
    return !!this.typeControl.value && !!this.codeControl.value;
  }

  onRetrieve(): void {
    const type = this.typeControl.value;
    const code = this.codeControl.value;
    if (!type || !code) return;

    this.validHHResources = [];
    this.filteredResources = [];
    this.allResources = [];
    this.appliedResourceFilters = null;
    this.filterChips = [];
    this.isLoading = true;

    const request: RetrieveValidHHResourceConfigRequest = {
      codeType: type === 'Question' ? 'Q' : 'O',
      code: code.code
    };

    this.service.retrieveResources(request)
      .pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.allResources = response.data;
          this.validHHResources = response.data;
          this.filteredResources = response.data;
        } else {
          this.allResources = [];
          this.validHHResources = [];
          this.filteredResources = [];
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.allResources = [];
        this.validHHResources = [];
        this.filteredResources = [];
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // --- Add / Edit Resource ---

  get isAddNewResourceEnabled(): boolean {
    return !!this.codeControl.value;
  }

  onAddNewResource(): void {
    const selectedCode = this.codeControl.value;
    if (!selectedCode) return;

    const dialogData: ResourceDialogData = {
      mode: 'add',
      code: selectedCode.code,
      effectiveDate: null,
      terminationDate: null
    };

    const dialogRef = this.dialog.open(AddEditResourceDialog, {
      width: '35vw',
      height: '100vh',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '0' },
      data: dialogData
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result: ResourceDialogResult) => {
      if (result) {
        const type = this.typeControl.value;

        const request: AddValidHHResourceRequest = {
          codeType: type === 'Question' ? 'Q' : 'O',
          code: result.code,
          locationLink: result.locationLink,
          description: result.description,
          effectiveDate: result.effectiveDate,
          terminationDate: result.terminationDate
        };
        this.service.addResource(request)
          .pipe(takeUntil(this.destroy$)).subscribe({
            next: (response) => {
              this.snackbarService.showSuccess(response?.message || 'Resource added successfully');
              this.onRetrieve();
            },
            error: (err) => {
              const errorCode = err?.error?.errorCode || err?.status;
              const errorMessage = err?.error?.message || 'Error adding resource';
              this.snackbarService.showError(`Error ${errorCode} : ${errorMessage}`);
            }
          });
      }
    });
  }

  onEditResource(resource: ValidHHResource): void {
    const dialogData: ResourceDialogData = {
      mode: 'edit',
      code: resource.code,
      locationLink: resource.locationLink,
      description: resource.description,
      effectiveDate: resource.effectiveDate,
      terminationDate: resource.terminationDate
    };

    const dialogRef = this.dialog.open(AddEditResourceDialog, {
      width: '35vw',
      height: '100vh',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '0' },
      data: dialogData
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result: ResourceDialogResult) => {
      if (result) {
        const request: UpdateValidHHResourceRequest = {
          currentCode: result.currentCode!,
          currentLocationLink: result.currentLocationLink!,
          currentEffectiveDate: result.currentEffectiveDate || '',
          locationLink: result.locationLink,
          description: result.description,
          effectiveDate: result.effectiveDate,
          terminationDate: result.terminationDate
        };
        this.service.updateResource(request)
          .pipe(takeUntil(this.destroy$)).subscribe({
            next: (response) => {
              this.snackbarService.showSuccess(response?.message || 'Resource updated successfully');
              this.onRetrieve();
            },
            error: (err) => {
              const errorCode = err?.error?.errorCode || err?.status;
              const errorMessage = err?.error?.message || 'Error updating resource';
              this.snackbarService.showError(`Error ${errorCode} : ${errorMessage}`);
            }
          });
      }
    });
  }

  onResourceRowAction(event: TableRowActionEvent<ValidHHResource>): void {
    if (event.action === 'edit') {
      this.onEditResource(event.row);
    }
  }

  onPageChange(event: TablePageEvent): void {
    // Pagination handled by DataTable
  }

  onSearch(searchText: string): void {
    const baseData = this.validHHResources;
    if (!searchText || searchText.trim() === '') {
      this.filteredResources = [...baseData];
    } else {
      const searchLower = searchText.toLowerCase().trim();
      this.filteredResources = baseData.filter(resource =>
        resource.locationLink?.toLowerCase().includes(searchLower) ||
        resource.description?.toLowerCase().includes(searchLower)
      );
    }
    this.cdr.markForCheck();
  }

  onSortChange(event: TableSortEvent): void {
    this.resourceTableConfig = {
      ...this.resourceTableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.selectedTabIndex = event.index;
  }

  // --- Filter ---

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  closeFilter(): void {
    this.isFilterOpen = false;
  }

  applyFilters(filters: ResourceFilter): void {
    this.appliedResourceFilters = filters;
    this.filterChips = ResourceFilterChipsUtils.convertFiltersToChips(filters);
    this.closeFilter();
    this.applyResourceFilters();
  }

  private applyResourceFilters(): void {
    if (!this.appliedResourceFilters) {
      this.validHHResources = [...this.allResources];
      this.filteredResources = [...this.allResources];
      this.filterChips = [];
      this.cdr.markForCheck();
      return;
    }

    const { effectiveDate, effectiveDatePeriod, terminationDate, terminationDatePeriod } =
      this.appliedResourceFilters;

    this.validHHResources = this.allResources.filter(row => {
      let valid = true;

      if (valid && effectiveDate && effectiveDatePeriod) {
        const rowDate = this.parseFilterDate(row.effectiveDate);
        const filterDate = new Date(effectiveDate);
        if (rowDate) {
          valid = effectiveDatePeriod === 'AFTER' ? rowDate >= filterDate : rowDate <= filterDate;
        }
      }

      if (valid && terminationDate && terminationDatePeriod) {
        const rowDate = this.parseFilterDate(row.terminationDate);
        const filterDate = new Date(terminationDate);
        if (rowDate) {
          valid = terminationDatePeriod === 'AFTER' ? rowDate >= filterDate : rowDate <= filterDate;
        }
      }

      return valid;
    });

    this.filteredResources = [...this.validHHResources];
    this.cdr.markForCheck();
  }

  private parseFilterDate(dateString: string | null | undefined): Date | null {
    if (!dateString) return null;
    const parsed = moment(dateString);
    return parsed.isValid() ? parsed.toDate() : null;
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedResourceFilters = ResourceFilterChipsUtils.removeFilterByChipKey(
      this.appliedResourceFilters,
      chipKey
    );
    this.filterChips = ResourceFilterChipsUtils.convertFiltersToChips(this.appliedResourceFilters);
    this.applyResourceFilters();
  }

  hasActiveFilters(): boolean {
    return ResourceFilterChipsUtils.hasActiveFilters(this.appliedResourceFilters);
  }

  clearAllFilters(): void {
    this.appliedResourceFilters = null;
    this.filterChips = [];
    this.applyResourceFilters();
  }

  // --- Donor Response Configuration ---

  onClearDonorResponseChanges(): void {
    if (this.donorResponseOriginalValues) {
      this.donorResponseForm.patchValue({
        onlineResponsesFlag: this.donorResponseOriginalValues.onlineResponsesFlag,
        multiLanguageFlag: this.donorResponseOriginalValues.multiLanguageFlag,
        effectiveDate: this.donorResponseOriginalValues.effectiveDate,
        terminationDate: this.donorResponseOriginalValues.terminationDate
      });
    } else {
      this.donorResponseForm.patchValue({
        onlineResponsesFlag: false,
        multiLanguageFlag: false,
        effectiveDate: null,
        terminationDate: null
      });
    }
    this.donorResponseForm.markAsPristine();
    this.donorResponseForm.markAsUntouched();
    this.isDonorResponseDirty = false;
  }

  onSaveDonorResponseConfig(): void {
    this.donorResponseForm.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.donorResponseForm, 'terminationDate');

    // Clear matDatepickerMin error on effectiveDate if it exists. This error can persist
    // when a past effective date was loaded from the server and the datepicker's internal
    // _min was not yet updated before the first validator run. The adjusted minDate already
    // matches the loaded value, so this error is stale — all other real errors are preserved.
    const effCtrl = this.donorResponseForm.get('effectiveDate');
    if (effCtrl?.hasError('matDatepickerMin')) {
      const { matDatepickerMin: _stale, ...remaining } = effCtrl.errors!;
      effCtrl.setErrors(Object.keys(remaining).length ? remaining : null);
    }

    if (this.donorResponseForm.errors?.['dateRangeInvalid'] && !this.donorLastChangedDateField) {
      this.donorLastChangedDateField = 'effective';
    }

    if (this.donorResponseForm.invalid) return;

    this.isSaving = true;
    const donorResponse = this.donorResponseForm.value;
    const effectiveDate = donorResponse.effectiveDate as Moment;
    const terminationDate = donorResponse.terminationDate as Moment | null;

    const request: SaveDonorResponseConfigRequest = {
      donorResponseFlag: donorResponse.onlineResponsesFlag ? 'Y' : 'N',
      multiLangaugeFlag: donorResponse.multiLanguageFlag ? 'Y' : 'N',
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(effectiveDate) || '',
      terminationDate: DateFieldValidationUtility.serializeDateForApi(terminationDate),
      auditKey: this.donorResponseOriginalValues?.auditKey
    };

    this.service.saveDonorResponseConfiguration(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.snackbarService.showSuccess(response?.message || 'Donor Response Configuration saved successfully');
          const savedAuditKey = response?.item?.auditKey ?? this.donorResponseOriginalValues?.auditKey ?? null;
          this.donorResponseOriginalValues = {
            onlineResponsesFlag: donorResponse.onlineResponsesFlag,
            multiLanguageFlag: donorResponse.multiLanguageFlag,
            effectiveDate: effectiveDate ? effectiveDate.clone() : null,
            terminationDate: terminationDate ? terminationDate.clone() : null,
            auditKey: savedAuditKey
          };
          this.donorResponseForm.markAsPristine();
          this.isDonorResponseDirty = false;
          this.isSaving = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error saving Donor Response Configuration';
          this.snackbarService.showError(errorMessage);
          this.isSaving = false;
          this.cdr.markForCheck();
        }
      });
  }

  private computeIsDirty(): boolean {
    if (!this.donorResponseOriginalValues) return false;
    const current = this.donorResponseForm.getRawValue();
    const orig = this.donorResponseOriginalValues;
    const effCurrent = current.effectiveDate ? moment(current.effectiveDate).format('YYYY-MM-DD') : null;
    const effOrig = orig.effectiveDate ? orig.effectiveDate.format('YYYY-MM-DD') : null;
    const termCurrent = current.terminationDate ? moment(current.terminationDate).format('YYYY-MM-DD') : null;
    const termOrig = orig.terminationDate ? orig.terminationDate.format('YYYY-MM-DD') : null;
    return current.onlineResponsesFlag !== orig.onlineResponsesFlag ||
      current.multiLanguageFlag !== orig.multiLanguageFlag ||
      effCurrent !== effOrig ||
      termCurrent !== termOrig;
  }

  getDonorEffectiveDateError(): string {
    const formErrors = this.donorLastChangedDateField === 'effective' ? this.donorResponseForm.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.donorResponseForm.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getDonorTerminationDateError(): string {
    const formErrors = this.donorLastChangedDateField === 'termination' ? this.donorResponseForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.donorResponseForm.get('terminationDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  onDonorEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.donorResponseForm.get('effectiveDate')
    );
  }

  onDonorEffectiveDateChange(): void {
    this.donorResponseForm.get('effectiveDate')?.markAsTouched();
    this.donorResponseForm.get('effectiveDate')?.markAsDirty();
    this.donorResponseForm.updateValueAndValidity();
    this.isDonorResponseDirty = this.computeIsDirty();
  }

  onDonorTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.donorResponseForm.get('terminationDate'), true
    );
  }

  onFlagChange(controlName: 'onlineResponsesFlag' | 'multiLanguageFlag', checked: boolean): void {
    this.donorResponseForm.get(controlName)?.setValue(checked);
    this.donorResponseForm.updateValueAndValidity();
    this.isDonorResponseDirty = this.computeIsDirty();
  }


  formatDateForDisplay(dateString: string): string {
    if (!dateString) return '';
    const parsedDate = moment(dateString);
    if (!parsedDate.isValid()) return '';
    return parsedDate.format('DD-MMM-YYYY').toUpperCase();
  }
}
