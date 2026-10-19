import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, MatPaginator, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { FocusTrapFactory, FocusTrap } from '@angular/cdk/a11y';

import { ProcedureCodeApiService } from '../services/procedure-code-api.service';
import { ProcedureCode, ProcedureCodeFilter } from '../models/procedure-code.model';
import { AddUpdateProcedureCodeComponent } from '../add-update-procedure-code/add-update-procedure-code';
import { FilterProcedureCodesComponent } from '../filter-procedure-codes/filter-procedure-codes';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { MenuService } from '@shared/services/menu.service';
import { HeaderService } from '@shared/services/header.service';
import { ROUTE_REGISTRY } from '../../../../core/constants/route-registry';
import { RouteKey } from '../../../../core/constants/route-keys';
import { ROUTES } from '../../../../core/constants/route.constants';

function getPaginatorIntl(): MatPaginatorIntl {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Rows per page:';
  return paginatorIntl;
}

@Component({
  selector: 'app-define-procedure-codes',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    FilterChips,
    SearchBar,
  ],
  templateUrl: './define-procedure-codes.html',
  styleUrls: ['./define-procedure-codes.scss'],
  providers: [
    { provide: MatPaginatorIntl, useFactory: getPaginatorIntl },
  ],
})
export class DefineProcedureCodesComponent implements OnInit, OnDestroy {
  private service = inject(ProcedureCodeApiService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private overlay = inject(Overlay);
  private destroy$ = new Subject<void>();
  private menuService = inject(MenuService);
  private headerService = inject(HeaderService);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: [{
      label: 'ADD PROCEDURE CODE',
      icon: 'add',
      color: 'accent',
      ariaLabel: 'Add new procedure code',
      onClick: () => this.openAddDialog()
    }]
  };

  dataSource = new MatTableDataSource<ProcedureCode>([]);

  displayedColumns: string[] = [
    'procedureCode',
    'description',
    'deferralDays',
    'achievementCredits',
    'procedureDuration',
    'sequence',
    'effectiveDate',
    'terminationDate',
    'actions',
  ];

  isLoading = false;
  totalRecords = 0;
  pageSize = 25;
  pageIndex = 0;
  sortColumn = 'sequence';
  sortDirection: 'A' | 'D' = 'A';

  searchTerm = '';
  currentFilters: ProcedureCodeFilter = {};
  filterChips: FilterChip[] = [];
  isFilterPanelOpen = false;
  editingRowCode: string | null = null;

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by procedure code or description',
    minLength: 0,
    ariaLabel: 'Search by procedure code or description',
    debounceTime: 300,
    searchOnEnterOnly: false
  };

  private overlayRef: OverlayRef | null = null;
  private focusTrapFactory = inject(FocusTrapFactory);
  private focusTrap: FocusTrap | null = null;

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.DefineProcedureCodes].path;
        const menuItem = this.menuService.findMenuItemByPath(basePath);

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

  ngOnInit(): void {
    this.loadProcedureCodes();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeFilter();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
      });
  }

  loadProcedureCodes(): void {
    this.isLoading = true;

    const skip = this.pageIndex * this.pageSize;
    const take = this.pageSize;

    const filter: ProcedureCodeFilter = {
      ...this.currentFilters,
      search: this.searchTerm || undefined,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection === 'A' ? 'asc' : 'desc',
    };

    this.service.getProcedureCodes(take, skip, filter).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalRecords = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading procedure codes:', error);
        this.isLoading = false;
        this.showError('Failed to load procedure codes. Please try again.');
      },
    });
  }

  onSearchEvent(searchText: string): void {
    this.searchTerm = searchText;
    this.pageIndex = 0;
    this.loadProcedureCodes();
  }

  hasActiveFilters(): boolean {
    return this.filterChips.length > 0;
  }

  onRemoveFilterChip(key: string): void {
    this.removeFilter(key);
  }

  onSort(sortState: Sort): void {
    this.sortColumn = sortState.active || 'sequence';
    this.sortDirection = sortState.direction === 'desc' ? 'D' : 'A';
    this.pageIndex = 0;
    this.loadProcedureCodes();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.loadProcedureCodes();
  }

  openFilter(): void {
    if (this.overlayRef?.hasAttached()) {
      this.closeFilter();
      return;
    }

    this.isFilterPanelOpen = true;

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.tableCard)
      .withPositions([
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 56
        }
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: false,
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const portal = new ComponentPortal(FilterProcedureCodesComponent);
    const componentRef = this.overlayRef.attach(portal);

    this.focusTrap = this.focusTrapFactory.create(this.overlayRef.overlayElement);
    this.focusTrap.focusInitialElementWhenReady();

    componentRef.instance.currentFilters = this.currentFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.currentFilters = filters;
        this.buildFilterChips();
        this.pageIndex = 0;
        this.loadProcedureCodes();
        this.closeFilter();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilter();
      });
  }

  private closeFilter(): void {
    this.isFilterPanelOpen = false;
    this.focusTrap?.destroy();
    this.focusTrap = null;
    this.overlayRef?.detach();
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }

  buildFilterChips(): void {
    const chips: FilterChip[] = [];

    if (this.currentFilters.procedureCode) {
      chips.push({
        key: 'procedureCode',
        label: `Procedure Code: ${this.currentFilters.procedureCode}`,
        value: this.currentFilters.procedureCode,
      });
    }

    if (this.currentFilters.deferralDays !== null && this.currentFilters.deferralDays !== undefined) {
      chips.push({
        key: 'deferralDays',
        label: `Deferral Days: ${this.currentFilters.deferralDays}`,
        value: String(this.currentFilters.deferralDays),
      });
    }

    if (this.currentFilters.effDate) {
      const periodDisplay = this.currentFilters.effDatePeriod === 'after' ? '≥' : '≤';
      const dateDisplay = this.formatDate(this.currentFilters.effDate);
      const displayValue = `${periodDisplay} ${dateDisplay}`;
      chips.push({
        key: 'effDate',
        label: `Effective Date ${displayValue}`,
        value: displayValue,
      });
    }

    if (this.currentFilters.termDate) {
      const periodDisplay = this.currentFilters.termDatePeriod === 'after' ? '≥' : '≤';
      const dateDisplay = this.formatDate(this.currentFilters.termDate);
      const displayValue = `${periodDisplay} ${dateDisplay}`;
      chips.push({
        key: 'termDate',
        label: `Termination Date ${displayValue}`,
        value: displayValue,
      });
    }

    this.filterChips = chips;
  }

  removeFilter(key: string): void {
    switch (key) {
      case 'procedureCode':
        delete this.currentFilters.procedureCode;
        break;
      case 'deferralDays':
        delete this.currentFilters.deferralDays;
        break;
      case 'effDate':
        delete this.currentFilters.effDate;
        delete this.currentFilters.effDatePeriod;
        break;
      case 'termDate':
        delete this.currentFilters.termDate;
        delete this.currentFilters.termDatePeriod;
        break;
    }

    this.buildFilterChips();
    this.pageIndex = 0;
    this.loadProcedureCodes();
  }

  clearAllFilters(): void {
    this.currentFilters = {};
    this.filterChips = [];
    this.searchTerm = '';
    this.pageIndex = 0;
    this.loadProcedureCodes();
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddUpdateProcedureCodeComponent, {
      width: '745px',
      height: '100vh',
      maxWidth: '90vw',
      disableClose: true,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '0' },
      autoFocus: false,
      restoreFocus: false,
      ariaModal: true,
      data: { mode: 'add' },
    });

    dialogRef.afterClosed().subscribe((result: { success: boolean } | undefined) => {
      if (result?.success) {
        this.pageIndex = 0;
        this.loadProcedureCodes();
      }
    });
  }

  openEditDialog(row: ProcedureCode): void {
    // Set the editing row to persist highlight
    this.editingRowCode = row.procedureCode;

    // Fetch the latest data before opening edit dialog
    this.isLoading = true;
    this.service.getProcedureCodeByCode(row.procedureCode).subscribe({
      next: (procedureData) => {
        this.isLoading = false;
        const dialogRef = this.dialog.open(AddUpdateProcedureCodeComponent, {
          width: '745px',
          height: '100vh',
          maxWidth: '90vw',
          disableClose: true,
          panelClass: 'right-side-dialog',
          position: { right: '0', top: '0' },
          autoFocus: false,
          restoreFocus: false,
          ariaModal: true,
          data: {
            mode: 'edit',
            procedureCode: procedureData.procedureCode,
            description: procedureData.description,
            deferralDays: procedureData.deferralDays,
            achievementCredits: procedureData.achievementCredits,
            procedureDuration: procedureData.procedureDuration,
            sequence: procedureData.sequence,
            effectiveDate: procedureData.effectiveDate ? new Date(procedureData.effectiveDate) : null,
            terminationDate: procedureData.terminationDate ? new Date(procedureData.terminationDate) : null,
            standardRbcLoss: procedureData.standardRbcLoss,
            standardPlasmaLoss: procedureData.standardPlasmaLoss,
            extracorporealRbcLoss: procedureData.extracorporealRbcLoss,
            extracorporealPlasmaLoss: procedureData.extracorporealPlasmaLoss,
          },
        });

        dialogRef.afterClosed().subscribe((result: { success: boolean } | undefined) => {
          // Clear the editing row highlight
          this.editingRowCode = null;

          if (result?.success) {
            this.loadProcedureCodes();
          }
        });
      },
      error: (error) => {
        console.error('Error fetching procedure code:', error);
        this.isLoading = false;
        this.editingRowCode = null;
        this.showError('Failed to fetch procedure code details. Please try again.');
      },
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  private showError(message: string): void {
  }
}
