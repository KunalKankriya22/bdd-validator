import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import moment from 'moment';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { SearchBar } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import {
  ValidTestParmDto,
  CreateValidTestParmRequestDto,
  UpdateValidTestParmRequestDto,
  TparmFilterState,
  FormMode,
  ValidTestParmQueryDto,
  DateFilterOperator
} from '../models/tparm.model';
import { TparmApiService } from '../services/tparm-api.service';
import { TparmFilterPanelComponent } from '../components/tparm-filter-panel/tparm-filter-panel';
import { TparmDetailFormComponent } from '../components/tparm-detail-form/tparm-detail-form';

/**
 * Valid Test Staging Parameters (TPARM) Component
 *
 * Master-detail layout with:
 * - LEFT PANEL: Parameter list with search, filter, and add buttons
 * - RIGHT PANEL: Parameter detail form (add/edit modes)
 */
@Component({
  selector: 'app-tparm',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    FilterChips,
    TparmDetailFormComponent,
    TparmFilterPanelComponent
  ],
  templateUrl: './tparm.html',
  styleUrls: ['./tparm.scss']
})
export class TparmComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `tparm-${TparmComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  // Dependency injection
  private readonly apiService = inject(TparmApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly elRef = inject(ElementRef);
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly parameters = signal<ValidTestParmDto[]>([]);
  protected readonly selectedParameter = signal<ValidTestParmDto | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly formMode = signal<FormMode>(FormMode.ADD);
  protected readonly searchKeyword = signal<string>('');
  protected readonly filters = signal<TparmFilterState | null>(null);
  protected readonly activeFiltersCount = signal<number>(0);
  protected readonly showDetailPanel = signal<boolean>(false);
  protected readonly saving = signal<boolean>(false);

  // Computed values
  protected readonly isEmpty = computed(() => this.parameters().length === 0);
  protected readonly isReady = computed(() => !this.loading() && !this.error());
  protected readonly hasFilters = computed(() => this.activeFiltersCount() > 0);

  // Filter panel visibility
  protected readonly showFilter = signal<boolean>(false);

  // Page configuration
  protected readonly headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Valid Test Staging Parameters', link: null }
    ]
  };

  protected readonly searchConfig: SearchBarConfig = {
    placeholder: 'Search by code, description, or related...',
    minLength: 3,
    ariaLabel: 'Search parameters'
  };

  // Enums for template
  protected readonly FormMode = FormMode;

  ngOnInit(): void {
    this.loadData();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to chapter changes and reload data
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearFilters();
        this.searchKeyword.set('');
        this.loadData();
      });
  }

  /**
   * Load parameters with current filters and search
   */
  protected loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: ValidTestParmQueryDto = {
      searchKeyword: this.searchKeyword() || null,
      datatype: this.filters()?.datatype || null,
      voidCode: this.filters()?.voidCode || null,
      relatedCode: this.filters()?.relatedCode || null,
      effDateOperator: this.filters()?.effDateOperator || null,
      effDateValue: this.filters()?.effDateValue ?
        moment(this.filters()!.effDateValue).format('YYYY-MM-DD') : null,
      termDateOperator: this.filters()?.termDateOperator || null,
      termDateValue: this.filters()?.termDateValue ?
        moment(this.filters()!.termDateValue).format('YYYY-MM-DD') : null,
      sortColumn: 'ParmCode',
      sortOrder: 'ASC'
    };

    this.apiService.getAll(100, 0, query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.parameters.set(response.data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load parameters');
          this.loading.set(false);
        }
      });
  }

  /**
   * Handle search input changes
   */
  onSearch(keyword: string): void {
    this.searchKeyword.set(keyword);
    this.loadData();
  }

  /**
   * Toggle filter panel
   */
  onOpenFilters(): void {
    this.showFilter.set(!this.showFilter());
  }

  /**
   * Handle filter apply from inline panel
   */
  onFilterApply(filters: TparmFilterState): void {
    this.applyFilters(filters);
    this.showFilter.set(false);
  }

  /**
   * Handle filter close
   */
  onFilterClose(): void {
    this.showFilter.set(false);
  }

  /**
   * Apply filters and reload data
   */
  private applyFilters(filters: TparmFilterState): void {
    this.filters.set(filters);
    this.updateActiveFiltersCount();
    this.loadData();
  }

  /**
   * Update count of active filters
   */
  private updateActiveFiltersCount(): void {
    const current = this.filters();
    if (!current) {
      this.activeFiltersCount.set(0);
      return;
    }

    let count = 0;
    if (current.datatype) count++;
    if (current.relatedCode) count++;
    if (current.voidCode) count++;
    if (current.effDateOperator && current.effDateValue) count++;
    if (current.termDateOperator && current.termDateValue) count++;

    this.activeFiltersCount.set(count);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filters.set(null);
    this.activeFiltersCount.set(0);
    this.loadData();
  }

  /**
   * Get filter chips for display
   */
  getFilterChips(): FilterChip[] {
    const chips: FilterChip[] = [];
    const current = this.filters();

    if (!current) return chips;

    if (current.datatype) {
      chips.push({ key: 'datatype', label: `Datatype: ${current.datatype}`, value: current.datatype });
    }
    if (current.relatedCode) {
      chips.push({ key: 'relatedCode', label: `Related Code: ${current.relatedCode}`, value: current.relatedCode });
    }
    if (current.voidCode) {
      chips.push({ key: 'voidCode', label: `Void Code: ${current.voidCode}`, value: current.voidCode });
    }
    if (current.effDateOperator && current.effDateValue) {
      const date = moment(current.effDateValue).format('DD-MMM-YYYY');
      chips.push({
        key: 'effDate',
        label: `Effective Date: ${current.effDateOperator} ${date}`,
        value: `${current.effDateOperator} ${date}`
      });
    }
    if (current.termDateOperator && current.termDateValue) {
      const date = moment(current.termDateValue).format('DD-MMM-YYYY');
      chips.push({
        key: 'termDate',
        label: `Termination Date: ${current.termDateOperator} ${date}`,
        value: `${current.termDateOperator} ${date}`
      });
    }

    return chips;
  }

  onRemoveFilterChip(key: string): void {
    const current = this.filters();
    if (!current) return;

    const updated = { ...current };
    switch (key) {
      case 'datatype': updated.datatype = null; break;
      case 'relatedCode': updated.relatedCode = null; break;
      case 'voidCode': updated.voidCode = null; break;
      case 'effDate': updated.effDateOperator = null; updated.effDateValue = null; break;
      case 'termDate': updated.termDateOperator = null; updated.termDateValue = null; break;
    }
    this.filters.set(updated);
    this.updateActiveFiltersCount();
    this.loadData();
  }

  /**
   * Open add parameter panel
   */
  onAdd(): void {
    this.formMode.set(FormMode.ADD);
    this.selectedParameter.set(null);
    this.showDetailPanel.set(true);
    this.focusDetailPanel();
  }

  /**
   * Select parameter to view/edit
   */
  onSelectParameter(parameter: ValidTestParmDto): void {
    this.selectedParameter.set(parameter);
    this.formMode.set(FormMode.EDIT);
    this.showDetailPanel.set(true);
    this.focusDetailPanel();
  }

  /**
   * Check if parameter is selected
   */
  isSelected(parameter: ValidTestParmDto): boolean {
    return this.selectedParameter()?.parmCode === parameter.parmCode;
  }

  /**
   * Handle save action from detail form
   */
  onSave(request: CreateValidTestParmRequestDto | UpdateValidTestParmRequestDto): void {
    this.saving.set(true);

    if (this.formMode() === FormMode.ADD) {
      this.createParameter(request as CreateValidTestParmRequestDto);
    } else {
      this.updateParameter(request as UpdateValidTestParmRequestDto);
    }
  }

  /**
   * Create new parameter
   */
  private createParameter(request: CreateValidTestParmRequestDto): void {
    this.apiService.create(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.snackbarService.showSuccess(`New parameter ${response.parmCode} added successfully.`);
          this.saving.set(false);
          this.showDetailPanel.set(false);
          this.loadData();
        },
        error: (err) => {
          this.snackbarService.showError(err.error?.message || 'Failed to create parameter.');
          this.saving.set(false);
        }
      });
  }

  /**
   * Update existing parameter
   */
  private updateParameter(request: UpdateValidTestParmRequestDto): void {
    const parmCode = this.selectedParameter()?.parmCode;
    if (!parmCode) return;

    this.apiService.update(parmCode, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess(`Parameter ${parmCode} updated successfully.`);
          this.saving.set(false);
          this.showDetailPanel.set(false);
          this.loadData();
        },
        error: (err) => {
          this.snackbarService.showError(err.error?.message || 'Failed to update parameter.');
          this.saving.set(false);
        }
      });
  }

  /**
   * Handle add and create another action
   */
  onAddAndCreateAnother(request: CreateValidTestParmRequestDto): void {
    this.saving.set(true);

    this.apiService.create(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.snackbarService.showSuccess(`New parameter ${response.parmCode} added successfully.`);
          this.saving.set(false);
          this.loadData();
          // Reset form for next entry (handled by form component)
        },
        error: (err) => {
          this.snackbarService.showError(err.error?.message || 'Failed to create parameter.');
          this.saving.set(false);
        }
      });
  }

  private focusDetailPanel(): void {
    setTimeout(() => {
      const heading = this.elRef.nativeElement.querySelector(`#${this.elementId('detail-title')}`);
      heading?.focus();
    });
  }

  onCancel(): void {
    this.showDetailPanel.set(false);
    this.selectedParameter.set(null);
  }

  /**
   * Format date for display
   */
  formatDate(value: string | null): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }
}
