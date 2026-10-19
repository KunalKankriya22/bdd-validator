import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  effect,
} from "@angular/core";
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { FormBuilder, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";
import { Subject, takeUntil } from 'rxjs';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

import { MatTableModule, MatTableDataSource } from "@angular/material/table";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTabsModule } from "@angular/material/tabs";
import { MatPaginatorModule, MatPaginator } from "@angular/material/paginator";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSortModule, MatSort } from "@angular/material/sort";
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';

import {
  DonorInterdictionsService,
  DonorInterdiction,
  InterdictionDropdownDto,
  InterdictionLookupItem,
  DonorInterdictionSearchParams,
  LabFlagLookup,
} from "../services/donor-interdictions";

import { MatDialog } from "@angular/material/dialog";
import { DonorInterdictionFilterComponent } from '../donor-interdiction-filter/donor-interdiction-filter';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { AddEditDonorInterdictionCodesComponent } from '../add-edit-donor-interdiction-codes/add-edit-donor-interdiction-codes';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { MenuService } from '@shared/services/menu.service';
import { HeaderService } from '@shared/services/header.service';
import { ROUTE_REGISTRY } from '../../../../core/constants/route-registry';
import { RouteKey } from '../../../../core/constants/route-keys';
import { ROUTES } from '../../../../core/constants/route.constants';

interface DonorAppliedFilters {
  owner?: string;
  interdictionType?: string;
  deferral?: string;
  effectivePeriod?: string | null;
  effectiveDate?: Date | null;
  terminationPeriod?: string | null;
  terminationDate?: Date | null;
}

@Component({
  selector: "app-donor-interdiction-codes",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSortModule,

    MatSidenavModule,
    FilterChips,
    AddEditDonorInterdictionCodesComponent,
    SearchBar,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: "./donor-interdiction-codes.html",
  styleUrls: ["./donor-interdiction-codes.scss"],
})
export class DonorInterdictionCodesComponent implements OnInit, AfterViewInit, OnDestroy {
  /* ================= SERVICES ================= */

  private service = inject(DonorInterdictionsService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private menuService = inject(MenuService);
  private headerService = inject(HeaderService);

  /* ================= CLEANUP ================= */

  private destroy$ = new Subject<void>();

  /* ================= HEADER CONFIG ================= */

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  /* ================= TABLE ================= */

  dataSource = new MatTableDataSource<DonorInterdiction>([]);

  @ViewChild('drawer') drawer!: MatSidenav;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = [
    "expand",
    "code",
    "type",
    "owner",
    "deferral",
    "fixedPeriod",
    "period",
    "value",
    "minValue",
    "multipleFlag",
    "upgradeFlag",
    "effectiveDate",
    "terminationDate",
    "actions",
  ];

  /* ================= STATE ================= */

  loading = signal(false);
  expandedRow: DonorInterdiction | null = null;
  selectedRow: DonorInterdiction | null = null;
  selectedTab: "donor" | "lab" = "donor";
  selectedTabIndex = 0;

  /* ================= SEARCH ================= */

  searchText = '';

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Interdiction Type, Code or Description',
    minLength: 1,
    searchOnEnterOnly: true,
    alwaysShowTooltip: true,
  };

  /* ================= SIDE PANEL ================= */

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: DonorInterdiction | null = null;

  /* ================= FILTER ================= */

  showFilter = false;
  private filterDialogRef: any = null;

  filterForm = this.fb.group({
    owner: [""],
    interdictionType: [""],
    deferral: [""],
    effectivePeriod: [null as string | null],
    effectiveDate: [null, this.dateFormatValidator()],
    terminationPeriod: [null as string | null],
    terminationDate: [null, this.dateFormatValidator()],
  });

  /* ================= CUSTOM VALIDATORS ================= */

  private dateFormatValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const dateObj = value instanceof Date ? value : new Date(value);
      if (isNaN(dateObj.getTime())) {
        return { invalidDateFormat: true };
      }
      return null;
    };
  }

  /* ================= DROPDOWNS ================= */

  dropdowns!: InterdictionDropdownDto;
  allLabFlagOptions: LabFlagLookup[] = [];

  /* ================= FILTER CHIPS ================= */

  appliedFilters: DonorAppliedFilters = {};
  filterChips: FilterChip[] = [];

  /* ================= FILTER DROPDOWNS ================= */

  ownerList: string[] = [];
  interdictionTypeList: InterdictionLookupItem[] = [];

  deferralOptions = ["Yes", "No"];
  totalRecords = 0;
  serverFilters: Partial<DonorInterdictionSearchParams> = {};

  /* ================= CONSTRUCTOR ================= */

  constructor() {
    this.initializeHeaderConfig();

    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        // Try to find by DonorInterdictionCodes route first
        let menuItem = this.menuService.findMenuItemByPath(
          ROUTE_REGISTRY[RouteKey.DonorInterdictionCodes].path
        );

        // If not found, try ViewInterdictionCodes route (shared menu entry for both Donor and Lab tabs)
        if (!menuItem) {
          menuItem = this.menuService.findMenuItemByPath(
            ROUTE_REGISTRY[RouteKey.ViewInterdictionCodes].path
          );
        }

        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: ROUTES.HOME },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || ''
          };
        }
      }
    });
  }

  /* ================= LIFECYCLE ================= */

  ngOnInit(): void {
    this.loadDropdowns();
    this.subscribeToChapterChanges();

    const navState = history.state as { openMode?: 'add' | 'edit' };
    if (navState?.openMode === 'add') {
      setTimeout(() => {
        this.createRecord();
      });
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.sort) {
        this.sort.active = "code";
        this.sort.direction = "asc";
      }

      this.loadWithServerSort();

      if (this.paginator) {
        this.paginator.page
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            this.loadWithServerSort();
          });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ================= INITIALIZATION ================= */

  private initializeHeaderConfig(): void {
    this.headerConfig = {
      breadcrumbs: [],
      title: '',
      subtitle: '',
      actions: [{
        label: 'Add New Code',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Add New Code',
        onClick: () => this.createRecord()
      }]
    };
  }

  /**
   * Subscribe to chapter change events from header
   * Empty subscription as this screen only contains tables
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Empty subscription - no dropdown data to reload
      });
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;

    // Close filter dialog if open when switching tabs
    if (this.filterDialogRef) {
      this.filterDialogRef.close();
      this.filterDialogRef = null;
    }

    if (index === 0) {
      this.selectedTab = 'donor';
    } else if (index === 1) {
      this.selectedTab = 'lab';
      this.router.navigate([
        '/application-administration/lab-restricted/lab-interdiction-codes'
      ], { state: { fromTabNavigation: true } });
    }
  }

  goToLab(): void {
    this.selectedTab = 'lab';
    this.router.navigate([
      '/application-administration/lab-restricted/lab-interdiction-codes'
    ], { state: { fromTabNavigation: true } });
  }

  loadWithServerSort(): void {
    this.loading.set(true);

    const payload: DonorInterdictionSearchParams = {
      ...this.serverFilters,

      sortBy: this.sort?.active || "code",
      sortDirection: (this.sort?.direction || "asc").toUpperCase() as
        | "ASC"
        | "DESC",
    };

    const take = this.paginator?.pageSize || 25;
    const skip = (this.paginator?.pageIndex || 0) * take;

    this.service.searchSortFilter(take, skip, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.dataSource.data = res.data;
        this.totalRecords = res.total;
        this.loading.set(false);
      },
      error: (err) => {
        console.error('API Error:', err);
        this.loading.set(false);
      },
    });
  }

  /* ================= DATA ================= */

  loadData(): void {
    this.loading.set(true);

    this.service.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.loading.set(false);
      },
      error: (err) => {
        console.error('API Error:', err);
        this.loading.set(false);
      },
    });
  }

  /* ================= DROPDOWNS ================= */

  loadDropdowns(): void {
    this.service.getLookups().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.dropdowns = res.dropdowns;
        this.allLabFlagOptions = res.labFlags;
        this.ownerList = ['B', 'U', 'D'];
        this.interdictionTypeList = res.dropdowns.typeItems ?? [];
      },
      error: (err) => {
        console.error("Failed to load lookups", err);
      },
    });
  }

  /* ================= EXPAND ================= */

  toggleRow(row: DonorInterdiction): void {
    this.expandedRow = this.expandedRow === row ? null : row;
  }

  /* ================= SEARCH ================= */

  onSearch(value: string): void {
    if (!value) {
      const { search, ...rest } = this.serverFilters;
      this.serverFilters = rest;
      if (this.paginator) {
        this.paginator.pageIndex = 0;
      }
      this.loadWithServerSort();
      return;
    }

    this.serverFilters = { ...this.serverFilters, search: value };
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadWithServerSort();
  }

  onSearchCleared(): void {
    this.searchText = '';
    const { search, ...rest } = this.serverFilters;
    this.serverFilters = rest;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadWithServerSort();
  }

  /* ================= SORT ================= */

  getSortIcon(column: string): string {
    if (!this.sort || this.sort.active !== column || !this.sort.direction) {
      return 'unfold_more';
    }
    return this.sort.direction === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  toggleSort(column: string): void {
    if (!this.sort) return;
    if (this.sort.active !== column) {
      this.sort.active = column;
      this.sort.direction = 'asc';
    } else {
      this.sort.direction = this.sort.direction === 'asc' ? 'desc' : 'asc';
    }
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadWithServerSort();
  }

  /* ================= FILTER ACTIONS ================= */

  openFilter(event?: MouseEvent): void {
    // Close existing dialog if open
    if (this.filterDialogRef) {
      this.filterDialogRef.close();
    }

    const button = event?.currentTarget as HTMLElement;
    const rect = button?.getBoundingClientRect();

    const dialogWidth = 340;
    const spacing = 8;

    const left = rect ? Math.min(rect.left - 20, window.innerWidth - dialogWidth - spacing) : 0;
    const top = rect ? rect.bottom + spacing : 0;

    this.filterDialogRef = this.dialog.open(DonorInterdictionFilterComponent, {
      width: `${dialogWidth}px`,
      maxWidth: '90vw',
      panelClass: 'error-filter-dialog',
      backdropClass: 'transparent-backdrop',
      hasBackdrop: true,
      disableClose: false,
      autoFocus: 'first-tabbable',
      data: {
        owner: this.filterForm.value.owner,
        interdictionType: this.filterForm.value.interdictionType,
        deferral: this.filterForm.value.deferral,
        effectivePeriod: this.filterForm.value.effectivePeriod,
        effectiveDate: this.filterForm.value.effectiveDate,
        terminationPeriod: this.filterForm.value.terminationPeriod,
        terminationDate: this.filterForm.value.terminationDate,
        ownerList: this.ownerList,
        interdictionTypeList: this.interdictionTypeList
      },
      position: {
        top: `${top}px`,
        left: `${left}px`,
      },
    });

    this.filterDialogRef.afterClosed().subscribe((filters: any) => {
      this.filterDialogRef = null;
      button?.focus();
      if (filters) {
        this.filterForm.patchValue(filters);
        this.onApplyFilter();
      }
    });
  }

  closeFilter(): void {
    this.showFilter = false;
  }

  onClearFilter(): void {
    this.filterForm.reset({
      owner: null,
      interdictionType: null,
      deferral: null,
      effectivePeriod: null,
      effectiveDate: null,
      terminationPeriod: null,
      terminationDate: null,
    });

    this.appliedFilters = {};
    this.serverFilters = {};
    this.updateFilterChips();

    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }

    this.loadWithServerSort();
  }

  onApplyFilter(): void {
    const f = this.filterForm.value;

    if (f.effectiveDate && !this.isValidDate(f.effectiveDate)) {
      return;
    }

    if (f.terminationDate && !this.isValidDate(f.terminationDate)) {
      return;
    }

    if (f.effectiveDate && f.terminationDate) {
      const effDate = new Date(f.effectiveDate);
      const termDate = new Date(f.terminationDate);
      if (termDate < effDate) {
        return;
      }
    }

    const newAppliedFilters: DonorAppliedFilters = {};
    const filters: Partial<DonorInterdictionSearchParams> = {};

    if (f.owner) {
      newAppliedFilters.owner = f.owner;
      filters.owner = f.owner;
    }

    if (f.interdictionType) {
      newAppliedFilters.interdictionType = f.interdictionType;
      filters.interType = f.interdictionType;
    }

    if (f.deferral) {
      newAppliedFilters.deferral = f.deferral;
      filters.deferralFlag = f.deferral;
    }

    if (f.effectivePeriod && f.effectiveDate) {
      newAppliedFilters.effectivePeriod = f.effectivePeriod;
      newAppliedFilters.effectiveDate = f.effectiveDate;
      filters.effectivePeriod = f.effectivePeriod!.toUpperCase() as 'BEFORE' | 'AFTER';
      filters.effectiveDate = DateFieldValidationUtility.serializeDateForApi(f.effectiveDate) || '';
    }

    if (f.terminationPeriod && f.terminationDate) {
      newAppliedFilters.terminationPeriod = f.terminationPeriod;
      newAppliedFilters.terminationDate = f.terminationDate;
      filters.terminationPeriod = f.terminationPeriod!.toUpperCase() as 'BEFORE' | 'AFTER';
      filters.terminationDate = DateFieldValidationUtility.serializeDateForApi(f.terminationDate) || '';
    }

    this.appliedFilters = newAppliedFilters;
    this.serverFilters = filters;
    this.updateFilterChips();

    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadWithServerSort();
    this.showFilter = false;
  }

  updateFilterChips(): void {
    const chips: FilterChip[] = [];

    if (this.appliedFilters.owner) {
      chips.push({
        key: 'owner',
        label: `Owner: ${this.getOwnerDisplayName(this.appliedFilters.owner)}`,
        value: this.appliedFilters.owner
      });
    }

    if (this.appliedFilters.interdictionType) {
      chips.push({
        key: 'interdictionType',
        label: `Interdiction Type: ${this.appliedFilters.interdictionType}`,
        value: this.appliedFilters.interdictionType
      });
    }

    if (this.appliedFilters.deferral) {
      chips.push({
        key: 'deferral',
        label: `Deferral: ${this.appliedFilters.deferral === 'Y' ? 'Yes' : 'No'}`,
        value: this.appliedFilters.deferral
      });
    }

    if (this.appliedFilters.effectiveDate && this.appliedFilters.effectivePeriod) {
      const operator = this.appliedFilters.effectivePeriod.toUpperCase() === 'AFTER' ? '≥' : '≤';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${operator} ${DateFieldValidationUtility.formatDateForUI(this.appliedFilters.effectiveDate)}`,
        value: this.appliedFilters.effectiveDate
      });
    }

    if (this.appliedFilters.terminationDate && this.appliedFilters.terminationPeriod) {
      const operator = this.appliedFilters.terminationPeriod.toUpperCase() === 'AFTER' ? '≥' : '≤';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${operator} ${DateFieldValidationUtility.formatDateForUI(this.appliedFilters.terminationDate)}`,
        value: this.appliedFilters.terminationDate
      });
    }

    this.filterChips = chips;
  }

  removeFilter(key: string): void {
    switch (key) {
      case 'owner':
        delete this.appliedFilters.owner;
        this.filterForm.patchValue({ owner: null });
        delete this.serverFilters.owner;
        break;

      case 'interdictionType':
        delete this.appliedFilters.interdictionType;
        this.filterForm.patchValue({ interdictionType: null });
        delete this.serverFilters.interType;
        break;

      case 'deferral':
        delete this.appliedFilters.deferral;
        this.filterForm.patchValue({ deferral: null });
        delete this.serverFilters.deferralFlag;
        break;

      case 'effectiveDate':
        delete this.appliedFilters.effectiveDate;
        delete this.appliedFilters.effectivePeriod;
        this.filterForm.patchValue({ effectiveDate: null, effectivePeriod: null });
        delete this.serverFilters.effectiveDate;
        delete this.serverFilters.effectivePeriod;
        break;

      case 'terminationDate':
        delete this.appliedFilters.terminationDate;
        delete this.appliedFilters.terminationPeriod;
        this.filterForm.patchValue({ terminationDate: null, terminationPeriod: null });
        delete this.serverFilters.terminationDate;
        delete this.serverFilters.terminationPeriod;
        break;
    }

    this.updateFilterChips();

    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }

    this.loadWithServerSort();
  }

  /* ================= SIDE PANEL ACTIONS ================= */

  createRecord(): void {
    this.selectedRow = null;
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  editRecord(row: DonorInterdiction): void {
    // Highlight the row when edit is clicked
    this.selectedRow = row;

    this.loading.set(true);

    this.service.getByCode(row.code).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.sidePanelMode = 'edit';
        this.sidePanelData = data;
        this.sidePanelOpen = true;
        this.loading.set(false);
      },
      error: (err) => {
        console.error('API Error:', err);
        this.loading.set(false);
      },
    });
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    // Clear row selection when closing the side panel
    this.selectedRow = null;
  }

  onSaveSuccess(): void {
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadWithServerSort();
  }

  /* ================= HELPERS ================= */

  isValidDate(date: any): boolean {
    if (!date) return true;
    const dateObj = date instanceof Date ? date : new Date(date);
    return !isNaN(dateObj.getTime());
  }

  get isFilterFormValid(): boolean {
    if (this.filterForm.get('effectiveDate')?.invalid) {
      return false;
    }
    if (this.filterForm.get('terminationDate')?.invalid) {
      return false;
    }

    const f = this.filterForm.value;

    if (f.effectiveDate && f.terminationDate) {
      const effDate = new Date(f.effectiveDate);
      const termDate = new Date(f.terminationDate);
      if (isNaN(effDate.getTime()) || isNaN(termDate.getTime())) {
        return false;
      }
      if (termDate < effDate) {
        return false;
      }
    }

    return true;
  }

  getOwnerDisplayName(code: string): string {
    const ownerMap: { [key: string]: string } = {
      'D': 'Donor',
      'U': 'Unit',
      'B': 'Both'
    };
    const name = ownerMap[code] || code;
    return `${name} (${code})`;
  }
}
