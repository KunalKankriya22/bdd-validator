import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ViewChild,
  ElementRef,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { convertUTCToTimezone } from '@shared/date/timezone.util';
import {
  FcodeFormDialogComponent,
  FcodeDialogData,
  FcodeDialogResult
} from './components/fcode-form-dialog/fcode-form-dialog.component';
import { MasterServiceCodeService } from './services/master-service-code.service';
import {
  MasterServiceCodeDto,
  MasterServiceCodeQueryDto,
  MasterServiceCodeFilterOptions,
  MasterServiceCodeTableRow
} from './models/master-service-code.model';

function getFcodePaginatorIntl(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Rows per page:';
  return intl;
}

@Component({
  selector: 'app-fcode',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatMomentDateModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    FilterPanelBase,
    FilterChips,
    FcodeFormDialogComponent
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MatPaginatorIntl, useFactory: getFcodePaginatorIntl }
  ],
  templateUrl: './fcode.component.html',
  styleUrl: './fcode.component.scss'
})
export class FcodeComponent implements OnInit, OnDestroy {
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterButton', { read: ElementRef }) filterButtonRef!: ElementRef;

  private readonly service = inject(MasterServiceCodeService);
  private readonly fb = inject(FormBuilder);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  // Side panel state
  protected readonly sidePanelOpen = signal<boolean>(false);
  protected readonly sidePanelRecord = signal<MasterServiceCodeDto | null>(null);

  // Currently-editing row billing code (drives row highlight)
  protected readonly editingRow = signal<string | null>(null);

  // Filter panel state
  showFilterPanel = false;
  filterPanelTop = 0;
  filterPanelLeft = 0;
  filterPanelForm!: FormGroup;
  filterChips: FilterChip[] = [];

  // Whether any filter panel field has a value (controls Clear disabled)
  protected readonly filterHasValues = signal<boolean>(false);
  // Whether both date pairs are complete and at least one is filled (controls Apply disabled)
  protected readonly filterCanApply = signal<boolean>(false);

  // Component state
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly data = signal<MasterServiceCodeTableRow[]>([]);
  protected readonly totalRecords = signal<number>(0);

  // Search and filter state
  protected readonly searchKeyword = signal<string>('');
  protected readonly activeFilters = signal<MasterServiceCodeFilterOptions>({
    effectiveDatePeriod: null,
    effectiveDate: null,
    terminationDatePeriod: null,
    terminationDate: null
  });

  // Pagination state
  protected readonly pageSize = signal<number>(25);
  protected readonly pageIndex = signal<number>(0);
  protected readonly pageSizeOptions = [10, 25, 50, 100];

  protected readonly periodOptions = ['After', 'Before'];

  // Computed values
  protected readonly isEmpty = computed(() => this.data().length === 0 && !this.loading());
  protected readonly hasError = computed(() => !!this.error());
  protected readonly hasData = computed(() => this.data().length > 0);

  get hasActiveFilters(): boolean {
    return this.filterChips.length > 0;
  }

  protected pageHeaderConfig: PageHeaderConfig = {
    title: '',
    subtitle: '',
    breadcrumbs: [
      { label: 'Home', link: '/' }
    ],
    actions: [{
      label: 'ADD NEW MASTER SERVICE CODE',
      icon: 'add',
      color: 'primary',
      matButton: 'raised',
      ariaLabel: 'Add new master service code',
      onClick: () => this.onAddNew()
    }]
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
          title: pageData.title,
          subtitle: pageData.subtitle || '',
          breadcrumbs: [
            { label: 'Home', link: '/' },
            { label: pageData.title, link: null }
          ]
        };
      }
    });
  }

  protected readonly searchBarConfig: SearchBarConfig = {
    placeholder: 'Search by service code or description',
    minLength: 3,
    searchOnEnterOnly: true,
    ariaLabel: 'Search by service code or description',
    alwaysShowTooltip: true,
    tooltip: 'Search By Service Code Or Description'
  };

  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Side Panel ────────────────────────────────────────────────────────────

  onAddNew(): void {
    // Close panel first to ensure component is destroyed and recreated with fresh form
    this.sidePanelOpen.set(false);
    this.sidePanelRecord.set(null);
    this.editingRow.set(null);

    // Use setTimeout to ensure Angular change detection processes the close first
    setTimeout(() => {
      this.sidePanelOpen.set(true);
    });
  }

  onEdit(row: MasterServiceCodeTableRow): void {
    this.editingRow.set(row.billingCode);
    this.service.getByCode(row.billingCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data && response.data.length > 0) {
            // If panel is already open, just update the data (ngOnChanges will handle form patching)
            // If panel is closed, open it with the data
            this.sidePanelRecord.set(response.data[0]);
            this.sidePanelOpen.set(true);
          } else {
            this.editingRow.set(null);
          }
        },
        error: (err) => {
          this.editingRow.set(null);
          this.error.set(err?.error?.message || err?.message || 'Failed to load record details');
        }
      });
  }

  onPanelClosed(result: FcodeDialogResult | undefined): void {
    this.sidePanelOpen.set(false);
    this.sidePanelRecord.set(null);
    this.editingRow.set(null);
    if (result?.saved) {
      this.loadData();
      if (result.addAnother) {
        setTimeout(() => {
          this.sidePanelOpen.set(true);
        }, 50);
      }
    }
  }

  // ─── Filter Panel ──────────────────────────────────────────────────────────

  private initializeFilterForm(): void {
    this.filterPanelForm = this.fb.group({
      effectiveDatePeriod: [null],
      effectiveDate: [null],
      terminationDatePeriod: [null],
      terminationDate: [null]
    });

    this.filterPanelForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const hasAny = !!(val.effectiveDatePeriod || val.effectiveDate ||
                          val.terminationDatePeriod || val.terminationDate);
        this.filterHasValues.set(hasAny);

        const effComplete  = !!val.effectiveDatePeriod && !!val.effectiveDate;
        const termComplete = !!val.terminationDatePeriod && !!val.terminationDate;
        const effPartial   = !!val.effectiveDatePeriod !== !!val.effectiveDate;
        const termPartial  = !!val.terminationDatePeriod !== !!val.terminationDate;
        this.filterCanApply.set(
          (effComplete || termComplete) && !effPartial && !termPartial
        );
      });

    // Bidirectional pair validation: period ↔ date must be filled together
    this.filterPanelForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateEffectivePair());

    this.filterPanelForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateEffectivePair());

    this.filterPanelForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateTerminationPair());

    this.filterPanelForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateTerminationPair());
  }

  private validateEffectivePair(): void {
    const dateCtrl   = this.filterPanelForm.get('effectiveDate');
    const periodCtrl = this.filterPanelForm.get('effectiveDatePeriod');
    const hasDate    = !!dateCtrl?.value;
    const hasPeriod  = !!periodCtrl?.value;

    if (hasDate && !hasPeriod) {
      periodCtrl?.setValidators([Validators.required]);
      periodCtrl?.markAsTouched();
    } else {
      periodCtrl?.clearValidators();
    }
    periodCtrl?.updateValueAndValidity({ emitEvent: false });

    if (hasPeriod && !hasDate) {
      dateCtrl?.setValidators([Validators.required]);
      dateCtrl?.markAsTouched();
    } else {
      dateCtrl?.clearValidators();
    }
    dateCtrl?.updateValueAndValidity({ emitEvent: false });

    this.cdr.detectChanges();
  }

  private validateTerminationPair(): void {
    const dateCtrl   = this.filterPanelForm.get('terminationDate');
    const periodCtrl = this.filterPanelForm.get('terminationDatePeriod');
    const hasDate    = !!dateCtrl?.value;
    const hasPeriod  = !!periodCtrl?.value;

    if (hasDate && !hasPeriod) {
      periodCtrl?.setValidators([Validators.required]);
      periodCtrl?.markAsTouched();
    } else {
      periodCtrl?.clearValidators();
    }
    periodCtrl?.updateValueAndValidity({ emitEvent: false });

    if (hasPeriod && !hasDate) {
      dateCtrl?.setValidators([Validators.required]);
      dateCtrl?.markAsTouched();
    } else {
      dateCtrl?.clearValidators();
    }
    dateCtrl?.updateValueAndValidity({ emitEvent: false });

    this.cdr.detectChanges();
  }

  onOpenFilterPanel(): void {
    const current = this.activeFilters();
    this.filterPanelForm.patchValue({
      effectiveDatePeriod: current.effectiveDatePeriod,
      effectiveDate: current.effectiveDate ? moment(current.effectiveDate) : null,
      terminationDatePeriod: current.terminationDatePeriod,
      terminationDate: current.terminationDate ? moment(current.terminationDate) : null
    });
    this.filterPanelForm.markAsUntouched();

    if (this.filterButtonRef) {
      const rect = this.filterButtonRef.nativeElement.getBoundingClientRect();
      this.filterPanelTop = rect.bottom + 8;
      this.filterPanelLeft = rect.left;
    }

    this.showFilterPanel = true;
  }

  onCloseFilterPanel(): void {
    this.showFilterPanel = false;
  }

  onApplyFilters(): void {
    const value = this.filterPanelForm.value;
    let hasError = false;

    // Effective date pair: both required if either is filled
    if (value.effectiveDatePeriod && !value.effectiveDate) {
      this.filterPanelForm.get('effectiveDate')?.markAsTouched();
      this.filterPanelForm.get('effectiveDate')?.setErrors({ required: true });
      hasError = true;
    }
    if (value.effectiveDate && !value.effectiveDatePeriod) {
      this.filterPanelForm.get('effectiveDatePeriod')?.markAsTouched();
      this.filterPanelForm.get('effectiveDatePeriod')?.setErrors({ required: true });
      hasError = true;
    }

    // Termination date pair: both required if either is filled
    if (value.terminationDatePeriod && !value.terminationDate) {
      this.filterPanelForm.get('terminationDate')?.markAsTouched();
      this.filterPanelForm.get('terminationDate')?.setErrors({ required: true });
      hasError = true;
    }
    if (value.terminationDate && !value.terminationDatePeriod) {
      this.filterPanelForm.get('terminationDatePeriod')?.markAsTouched();
      this.filterPanelForm.get('terminationDatePeriod')?.setErrors({ required: true });
      hasError = true;
    }

    if (hasError) {
      this.cdr.detectChanges();
      return;
    }
    const filters: MasterServiceCodeFilterOptions = {
      effectiveDatePeriod: value.effectiveDatePeriod,
      effectiveDate: value.effectiveDate ? (value.effectiveDate as Moment).toDate() : null,
      terminationDatePeriod: value.terminationDatePeriod,
      terminationDate: value.terminationDate ? (value.terminationDate as Moment).toDate() : null
    };

    this.activeFilters.set(filters);
    this.filterChips = this.buildFilterChips(filters);
    this.showFilterPanel = false;
    this.pageIndex.set(0);
    this.loadData();
  }

  onClearFilterPanel(): void {
    this.filterPanelForm.reset();
    this.filterPanelForm.markAsUntouched();
    this.filterPanelForm.markAsPristine();
  }

  onClearFilters(): void {
    this.filterPanelForm.reset();
    this.filterPanelForm.markAsUntouched();
    this.filterPanelForm.markAsPristine();
    this.activeFilters.set({
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
    this.filterChips = [];
    this.showFilterPanel = false;
    this.pageIndex.set(0);
    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    const filters = { ...this.activeFilters() };
    if (chipKey === 'effectiveDate') {
      filters.effectiveDatePeriod = null;
      filters.effectiveDate = null;
    } else if (chipKey === 'terminationDate') {
      filters.terminationDatePeriod = null;
      filters.terminationDate = null;
    }
    this.activeFilters.set(filters);
    this.filterChips = this.buildFilterChips(filters);
    this.pageIndex.set(0);
    this.loadData();
  }

  private buildFilterChips(filters: MasterServiceCodeFilterOptions): FilterChip[] {
    const chips: FilterChip[] = [];
    if (filters.effectiveDatePeriod && filters.effectiveDate) {
      chips.push({
        key: 'effectiveDate',
        label: `Eff. Date ${filters.effectiveDatePeriod}: ${moment(filters.effectiveDate).format('DD-MMM-YYYY').toUpperCase()}`,
        value: filters.effectiveDate
      });
    }
    if (filters.terminationDatePeriod && filters.terminationDate) {
      chips.push({
        key: 'terminationDate',
        label: `Term. Date ${filters.terminationDatePeriod}: ${moment(filters.terminationDate).format('DD-MMM-YYYY').toUpperCase()}`,
        value: filters.terminationDate
      });
    }
    return chips;
  }

  // ─── Data ──────────────────────────────────────────────────────────────────

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    const skip = this.pageIndex() * this.pageSize();
    const take = this.pageSize();

    const queryDto: MasterServiceCodeQueryDto = {
      searchKeyword: this.searchKeyword() || null,
      sortColumn: 'BillingCode',
      sortOrder: 'ASC'
    };

    const filters = this.activeFilters();
    if (filters.effectiveDatePeriod && filters.effectiveDate) {
      if (filters.effectiveDatePeriod === 'After') {
        queryDto.effDateFrom = moment(filters.effectiveDate).format('YYYY-MM-DD');
      } else {
        queryDto.effDateTo = moment(filters.effectiveDate).format('YYYY-MM-DD');
      }
    }

    if (filters.terminationDatePeriod && filters.terminationDate) {
      if (filters.terminationDatePeriod === 'After') {
        queryDto.termDateFrom = moment(filters.terminationDate).format('YYYY-MM-DD');
      } else {
        queryDto.termDateTo = moment(filters.terminationDate).format('YYYY-MM-DD');
      }
    }

    this.service.getAll(take, skip, queryDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.data.set(this.mapToTableRows(response.data));
            this.totalRecords.set(response.total || 0);
          } else {
            this.data.set([]);
            this.totalRecords.set(0);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || err?.message || 'Failed to load master service codes');
          this.loading.set(false);
          this.data.set([]);
          this.totalRecords.set(0);
        }
      });
  }

  private mapToTableRows(dtos: MasterServiceCodeDto[]): MasterServiceCodeTableRow[] {
    return dtos.map(dto => ({
      billingCode: dto.billingCode,
      codeDesc: dto.codeDesc,
      effDate: dto.effDate,
      termDate: dto.termDate || null,
      lastModifiedDate: dto.lastModifiedDate || null
    }));
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    const timezone = this.headerService.getCurrentChapterTimezone() || 'UTC';
    const convertedDate = convertUTCToTimezone(dateString, timezone);
    const m = moment(convertedDate);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }

  onSearch(keyword: string): void {
    this.searchKeyword.set(keyword);
    this.pageIndex.set(0);
    this.loadData();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
    this.loadData();
  }

  onRetry(): void {
    this.loadData();
  }

  onFilterDateKeyPress(event: KeyboardEvent): void {
    if (
      event.key === 'Backspace' || event.key === 'Delete' ||
      event.key === 'Tab'       || event.key === 'Escape' ||
      event.key === 'Enter'     || event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight'|| event.key === 'ArrowUp' ||
      event.key === 'ArrowDown' || event.key === 'Home' ||
      event.key === 'End'       || event.ctrlKey || event.metaKey
    ) { return; }
    if (!/^[0-9a-zA-Z\-]$/.test(event.key)) { event.preventDefault(); }
  }

  getFilterEffectiveDateError(): string {
    const control = this.filterPanelForm?.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('invalidDateFormat')) return 'Effective Date is invalid';
    if (control.hasError('matDatepickerParse')) return 'Effective Date is invalid';
    if (control.hasError('required')) return 'Effective Date is required';
    return '';
  }

  getFilterTerminationDateError(): string {
    const control = this.filterPanelForm?.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('invalidDateFormat')) return 'Termination Date is invalid';
    if (control.hasError('matDatepickerParse')) return 'Termination Date is invalid';
    if (control.hasError('required')) return 'Termination Date is required';
    return '';
  }

  onFilterEffectiveDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.filterPanelForm?.get('effectiveDate');
    if (!control) return;
    if (!inputValue?.trim()) {
      control.setValue(null, { emitEvent: false });
      control.markAsPristine();
      control.markAsUntouched();
    } else {
      control.markAsTouched();
      control.markAsDirty();
      if (!control.value) { control.setErrors({ invalidDateFormat: true }); }
    }
  }

  onFilterTerminationDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.filterPanelForm?.get('terminationDate');
    if (!control) return;
    if (!inputValue?.trim()) {
      control.setValue(null, { emitEvent: false });
      control.markAsPristine();
      control.markAsUntouched();
    } else {
      control.markAsTouched();
      control.markAsDirty();
      if (!control.value) { control.setErrors({ invalidDateFormat: true }); }
    }
  }
}
