import { Component, OnInit, OnDestroy, ViewChild, ElementRef, effect, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OverlayModule } from '@angular/cdk/overlay';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { PhysicianService } from './services/physician.service';
import {
  PhysicianModel,
  PhysicianQueryParams
} from './models/physician.model';
import { PhysicianFilterValue } from './models/physician-filter.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { PhysicianFilterPanel } from './components/physician-filter-panel/physician-filter-panel';
import { PhysicianDetailForm } from './components/physician-detail-form/physician-detail-form';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import moment from 'moment';

@Component({
  selector: 'app-maintain-physician-list',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    FilterChips,
    PhysicianFilterPanel,
    PhysicianDetailForm
  ],
  templateUrl: './maintain-physician-list.html',
  styleUrls: ['./maintain-physician-list.scss']
})
export class MaintainPhysicianListComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  private static nextId = 0;
  protected readonly componentId = `maintain-physician-list-${MaintainPhysicianListComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by physician ID or name (press Enter)',
    minLength: 1,
    ariaLabel: 'Search by physician ID or name',
    searchOnEnterOnly: true
  };

  physicians = signal<PhysicianModel[]>([]);
  selectedPhysician = signal<PhysicianModel | null>(null);
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');

  appliedFilters: PhysicianFilterValue | null = null;
  filterChips: FilterChip[] = [];
  isFilterOpen = false;

  filterOverlayPositions: ConnectedPosition[] = [
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetX: 0,   // No spacing from right
      offsetY: -3   // Eliminate border overlap gap
    }
  ];

  isAddMode = signal<boolean>(false);
  showDetailPanel = signal<boolean>(false);
  hasSearched = signal<boolean>(false);

  searchText = '';

  requestState: PhysicianQueryParams = {};

  private returnState: any = null;
  private destroy$ = new Subject<void>();

  get isSearchAndFilterDisabled(): boolean {
    return this.isLoading() || this.hasError();
  }

  constructor(
    private physicianService: PhysicianService,
    private snackBar: MatSnackBar,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private router: Router
  ) {
    this.initializeConfigurations();

    // Update header config from menu-items API response
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
          subtitle: pageData.subtitle || 'Create, update, and manage physician records for donor communication'
        };
      }
    });
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    const state = (history.state as any);
    if (state?.returnUrl && state?.returnAction) {
      this.returnState = state;
      this.isAddMode.set(true);
      this.showDetailPanel.set(true);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ],
      title: 'Maintain Physician List',
      subtitle: 'Create, update, and manage physician records for donor communication',
      actions: []
    };

    this.searchConfig = {
      placeholder: 'Search by physician ID or name (press Enter)',
      minLength: 1,
      ariaLabel: 'Search by physician ID or name',
      searchOnEnterOnly: true
    };
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
      });
  }

  loadData(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.errorMessage.set('');

    const params: PhysicianQueryParams = {
      ...this.requestState,
      chapterId: this.headerService.getCurrentChapterId()
    };

    // Remember the currently selected physician ID to reselect after reload
    const currentPhysicianId = this.selectedPhysician()?.physicianId;

    this.physicianService.getPhysicians(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.physicians.set(response.data);
          this.isLoading.set(false);

          // If there was a selected physician, try to find and reselect it in the new list
          if (currentPhysicianId && response.data && response.data.length > 0) {
            const updatedPhysician = response.data.find(p => p.physicianId === currentPhysicianId);
            if (updatedPhysician) {
              this.selectedPhysician.set(updatedPhysician);
            }
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.hasError.set(true);
          this.errorMessage.set('Failed to load physicians. Please try again.');
        }
      });
  }

  onSearch(searchText: string): void {
    const trimmedText = searchText?.trim() || '';
    if (!trimmedText) {
      this.searchText = '';
      this.requestState = { ...this.requestState, searchText: undefined };
      this.physicians.set([]);
      this.selectedPhysician.set(null);
      this.showDetailPanel.set(false);
      this.isAddMode.set(false);
      this.hasSearched.set(false);
      return;
    }
    this.searchText = trimmedText;
    this.requestState = {
      ...this.requestState,
      searchText: trimmedText
    };
    this.hasSearched.set(true);
    this.loadData();
  }

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  onApplyFilters(filters: PhysicianFilterValue): void {
    this.appliedFilters = filters;
    this.isFilterOpen = false;

    this.requestState = {
      ...this.requestState,
      effectiveDateFrom: this.buildDateParam(filters.effectiveDate, filters.effectiveDatePeriod, 'from'),
      effectiveDateTo: this.buildDateParam(filters.effectiveDate, filters.effectiveDatePeriod, 'to'),
      terminationDateFrom: this.buildDateParam(filters.terminationDate, filters.terminationDatePeriod, 'from'),
      terminationDateTo: this.buildDateParam(filters.terminationDate, filters.terminationDatePeriod, 'to')
    };

    this.updateFilterChips(filters);
    this.loadData();
  }

  private buildDateParam(
    date: string | null | undefined,
    period: string | null | undefined,
    type: 'from' | 'to'
  ): string | undefined {
    if (!date || !period) return undefined;

    // Date is already in YYYY-MM-DD format from filter panel
    if (period === 'before') {
      return type === 'to' ? date : undefined;
    } else if (period === 'after') {
      return type === 'from' ? date : undefined;
    }

    return undefined;
  }

  private updateFilterChips(filters: PhysicianFilterValue): void {
    const chips: FilterChip[] = [];

    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const date = moment(filters.effectiveDate, 'YYYY-MM-DD').toDate();
      const dateStr = DateFieldValidationUtility.formatDateForUI(date);
      const periodSymbol = filters.effectiveDatePeriod === 'after' ? '>=' : '<=';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${periodSymbol} ${dateStr}`,
        value: filters.effectiveDate
      });
    }

    if (filters.terminationDate && filters.terminationDatePeriod) {
      const date = moment(filters.terminationDate, 'YYYY-MM-DD').toDate();
      const dateStr = DateFieldValidationUtility.formatDateForUI(date);
      const periodSymbol = filters.terminationDatePeriod === 'after' ? '>=' : '<=';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${periodSymbol} ${dateStr}`,
        value: filters.terminationDate
      });
    }

    this.filterChips = chips;
  }

  onRemoveFilterChip(chipId: string): void {
    if (!this.appliedFilters) return;

    const updatedFilters = { ...this.appliedFilters };

    switch (chipId) {
      case 'effectiveDate':
        updatedFilters.effectiveDate = null;
        updatedFilters.effectiveDatePeriod = null;
        break;
      case 'terminationDate':
        updatedFilters.terminationDate = null;
        updatedFilters.terminationDatePeriod = null;
        break;
    }

    this.onApplyFilters(updatedFilters);
  }

  onClearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.requestState = {
      searchText: this.searchText || undefined
    };
    this.loadData();
  }

  private clearAll(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.isFilterOpen = false;
    this.searchText = '';
    this.requestState = {};
    this.physicians.set([]);
    this.selectedPhysician.set(null);
    this.showDetailPanel.set(false);
    this.isAddMode.set(false);
    this.hasSearched.set(false);

    if (this.searchBarComponent) {
      this.searchBarComponent.searchText = '';
    }
  }

  onSelectPhysician(physician: PhysicianModel): void {
    this.selectedPhysician.set(physician);
    this.isAddMode.set(false);
    this.showDetailPanel.set(true);
  }

  onAddNewPhysician(): void {
    this.selectedPhysician.set(null);
    this.isAddMode.set(true);
    this.showDetailPanel.set(true);
  }

  onPhysicianSaved(physician: PhysicianModel): void {
    const physicianName = physician.physicianName;

    if (this.isAddMode()) {
      this.showSuccess(`Physician ${physicianName} created successfully`);
    } else {
      this.showSuccess(`Physician ${physicianName} updated successfully`);
    }

    if (this.returnState?.returnUrl) {
      const navState: any = { returnAction: this.returnState.returnAction };
      if (this.returnState.surgeryDialogData) {
        navState.surgeryDialogData = { ...this.returnState.surgeryDialogData, newPhysicianId: physician.physicianId };
      }
      if (this.returnState.addRequestDialogData) {
        navState.addRequestDialogData = { ...this.returnState.addRequestDialogData, newPhysicianId: physician.physicianId };
      }
      this.router.navigate([this.returnState.returnUrl], { state: navState });
      return;
    }

    this.loadData();

    // save response holds selection until loadData() refreshes the list
    this.selectedPhysician.set(physician);
    this.isAddMode.set(false);
    this.showDetailPanel.set(true);
  }

  onCancelDetail(): void {
    if (this.returnState?.returnUrl) {
      const navState: any = { returnAction: this.returnState.returnAction };
      if (this.returnState.surgeryDialogData) {
        navState.surgeryDialogData = { ...this.returnState.surgeryDialogData };
      }
      if (this.returnState.addRequestDialogData) {
        navState.addRequestDialogData = { ...this.returnState.addRequestDialogData };
      }
      this.router.navigate([this.returnState.returnUrl], { state: navState });
      return;
    }
    this.showDetailPanel.set(false);
    this.selectedPhysician.set(null);
    this.isAddMode.set(false);
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }
}
