import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject, takeUntil, finalize } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { EmfFilterPanel } from './emf-filter-panel/emf-filter-panel';
import { AddEditProcessCode, EditProcessCodeData } from './add-edit-process-code/add-edit-process-code';
import { buildEmfFilterChips } from './utils/filter-chips.utils';
import { EmfProcessesService, EmfProcessesParamsDto } from './services/emf-processes.service';
import moment from 'moment';

export interface ProcessCodesFilterValue {
  effectiveDatePeriod: string | null;
  effectiveDate: Date | null;
  terminationDatePeriod: string | null;
  terminationDate: Date | null;
}

export interface ProcessCode {
  procCode: string;
  procDesc: string;
  effDate: string;
  termDate?: string;
  programId?: string;
  insertDate?: string;
  insertUser?: string;
  auditKey?: number;
}

function getEmfPaginatorIntl(): MatPaginatorIntl {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Rows per page:';
  return paginatorIntl;
}

@Component({
  selector: 'app-define-process-codes',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    PageHeaderWithBreadcrumb,
    AddEditProcessCode,
    FilterChips,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    SearchBar
  ],
  providers: [
    { provide: MatPaginatorIntl, useFactory: getEmfPaginatorIntl }
  ],
  templateUrl: './emf-processes.html',
  styleUrls: ['./emf-processes.scss']
})
export class DefineProcessCodesComponent implements OnInit, OnDestroy {
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild(AddEditProcessCode) addEditComponent?: AddEditProcessCode;
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'EMF Processes', link: null }
    ],
    title: 'EMF Processes',
    subtitle: 'This screen allows you to create, configure, and manage Process Codes for Enhanced Manufacturing.',
    actions: [
      {
        label: 'ADD NEW PROCESS CODE',
        icon: 'add',
        variant: 'filled',
        ariaLabel: 'Add new process code',
        onClick: () => this.onAddNewProcessCode()
      }
    ]
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Code or Description',
    minLength: 2,
    ariaLabel: 'Search process codes',
    debounceTime: 300,
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };
  searchText = '';
  filteredProcessCodes: ProcessCode[] = [];
  isLoading = false;
  totalRecords = 0;
  pageSize = 25;
  pageIndex = 0;
  pageSizeOptions = [10, 25, 50, 100];

  // Sorting
  sortDirection: 'A' | 'D' = 'A';

  // Track selected row
  selectedProcCode: string | null = null;
  private wasExpandedBeforeEdit = false;
  private menuActionTriggered = false;

  isAddPanelOpen = false;
  addPanelMode: 'add' | 'edit' = 'add';
  editData: EditProcessCodeData | null = null;

  isFilterOpen = false;
  appliedFilters: ProcessCodesFilterValue | null = null;
  filterChips: FilterChip[] = [];
  private overlayRef: OverlayRef | null = null;
  private destroy$ = new Subject<void>();
  private previouslyFocusedElement: HTMLElement | null = null;

  constructor(
    private overlay: Overlay,
    private pageHeaderService: PageHeaderService,
    private emfProcessesService: EmfProcessesService,
    private snackBar: MatSnackBar,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
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
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(expandProcCode?: string | null): void {
    this.isLoading = true;
    const skip = this.pageIndex * this.pageSize;

    const params: EmfProcessesParamsDto = {
      searchText: this.searchText || undefined,
      sort: this.sortDirection || undefined
    };
    if (this.appliedFilters) {
      params.effectiveDatePeriod = this.appliedFilters.effectiveDatePeriod?.toUpperCase() || null;
      params.effectiveDate = this.appliedFilters.effectiveDate
        ? moment(this.appliedFilters.effectiveDate).format('YYYY-MM-DD')
        : null;
      params.terminationDatePeriod = this.appliedFilters.terminationDatePeriod?.toUpperCase() || null;
      params.terminationDate = this.appliedFilters.terminationDate
        ? moment(this.appliedFilters.terminationDate).format('YYYY-MM-DD')
        : null;
    }

    this.emfProcessesService.getProcessCodes(this.pageSize, skip, params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (result) => {
          this.filteredProcessCodes = result.data;
          this.totalRecords = result.totalRecords;
          this.expandedRows.clear();
          this.allExpanded = false;

          if (expandProcCode) {
            const editedRow = this.filteredProcessCodes.find(r => r.procCode === expandProcCode);
            if (editedRow) {
              if (this.wasExpandedBeforeEdit) {
                this.expandedRows.add(editedRow.procCode);
              }
              this.selectedProcCode = editedRow.procCode;
            }
          }
        },
        error: () => {
          this.filteredProcessCodes = [];
          this.totalRecords = 0;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.overlayRef) this.overlayRef.dispose();
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.closeFilterPanel();
      return;
    }
    this.previouslyFocusedElement = document.activeElement as HTMLElement;
    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.tableCard)
      .withPositions([{ originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'top', offsetX: 0, offsetY: 56 }])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });
    this.isFilterOpen = true;

    const portal = new ComponentPortal<EmfFilterPanel>(EmfFilterPanel);
    const componentRef = this.overlayRef.attach<EmfFilterPanel>(portal);
    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters: ProcessCodesFilterValue) => {
        this.appliedFilters = filters;
        this.filterChips = buildEmfFilterChips(filters);
        this.applyAllFilters();
        this.closeFilterPanel();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeFilterPanel());

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeFilterPanel());
  }

  private closeFilterPanel(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
    if (this.previouslyFocusedElement) {
      (this.previouslyFocusedElement as HTMLElement).focus();
      this.previouslyFocusedElement = null;
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.closeFilterPanel();
    }
  }

  private applyAllFilters(): void {
    this.pageIndex = 0;
    this.loadData();
  }

  allExpanded = false;
  expandedRows = new Set<string>();

  toggleExpandAll(): void {
    this.allExpanded = !this.allExpanded;
    if (this.allExpanded) {
      this.filteredProcessCodes.forEach(item => this.expandedRows.add(item.procCode));
    } else {
      this.expandedRows.clear();
    }
  }

  toggleExpand(procCode: string): void {
    if (this.expandedRows.has(procCode)) {
      this.expandedRows.delete(procCode);
    } else {
      this.expandedRows.add(procCode);
    }
  }

  onSort(): void {
    this.sortDirection = this.sortDirection === 'A' ? 'D' : 'A';
    this.pageIndex = 0;
    this.loadData();
  }

  getSortIcon(): string {
    return this.sortDirection === 'A' ? 'arrow_upward' : 'arrow_downward';
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  onSearch(searchText: string): void {
    this.searchText = searchText;
    this.pageIndex = 0;
    this.loadData();
  }

  onSearchCleared(): void {
    this.searchText = '';
    this.pageIndex = 0;
    this.loadData();
  }

  removeFilterChip(chipKey: string): void {
    if (!this.appliedFilters) return;
    switch (chipKey) {
      case 'effectiveDate':
        this.appliedFilters = { ...this.appliedFilters, effectiveDate: null, effectiveDatePeriod: null };
        break;
      case 'terminationDate':
        this.appliedFilters = { ...this.appliedFilters, terminationDate: null, terminationDatePeriod: null };
        break;
    }
    this.filterChips = buildEmfFilterChips(this.appliedFilters);
    this.applyAllFilters();
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.applyAllFilters();
  }

  onAddNewProcessCode(): void {
    // Force component recreation if panel is already open (e.g. switching from edit to add)
    if (this.isAddPanelOpen) {
      this.isAddPanelOpen = false;
      this.cdr.detectChanges();
    }
    this.addPanelMode = 'add';
    this.editData = null;
    this.isAddPanelOpen = true;
  }

  onAddPanelCancel(): void {
    this.isAddPanelOpen = false;
    this.editData = null;
    this.selectedProcCode = null;
  }

  onSaveSuccess(): void {
    this.loadData(this.selectedProcCode);
  }

  onEditDetails(item: ProcessCode): void {
    this.menuActionTriggered = true;
    this.selectedProcCode = item.procCode;
    this.wasExpandedBeforeEdit = this.expandedRows.has(item.procCode);

    // Force component recreation if panel is already open (e.g. switching from add to edit)
    if (this.isAddPanelOpen) {
      this.isAddPanelOpen = false;
      this.cdr.detectChanges();
    }

    // Open panel immediately with table row data
    this.editData = {
      code: item.procCode,
      description: item.procDesc,
      rulesText: '',
      effectiveDate: item.effDate,
      terminationDate: item.termDate
    };
    this.addPanelMode = 'edit';
    this.isAddPanelOpen = true;

    // Fetch full detail from API and update
    this.emfProcessesService.getProcessCodeById(item.procCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          this.editData = {
            code: detail.procCode,
            description: detail.procDesc,
            rulesText: '',
            effectiveDate: detail.effDate,
            terminationDate: detail.termDate
          };
        },
        error: (error: any) => {
          const message = error?.error?.errorResponse?.error
            || error?.error?.message
            || error?.message
            || 'Failed to load process code details';
          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  onDefineProcess(item: ProcessCode): void {
    this.menuActionTriggered = true;
    this.selectedProcCode = item.procCode;
    this.router.navigate(
      ['/application-administration/common-validation/emf-processes/define-process'],
      { queryParams: { code: item.procCode } }
    );
  }

  onViewEditMappings(item: ProcessCode): void {
    this.menuActionTriggered = true;
    this.selectedProcCode = item.procCode;
    this.router.navigate(['/mappings', item.procCode]);
  }

  onMenuOpened(item: ProcessCode): void {
    this.selectedProcCode = item.procCode;
    this.menuActionTriggered = false;
  }

  onMenuClosed(): void {
    if (!this.menuActionTriggered) {
      this.selectedProcCode = null;
    }
    this.menuActionTriggered = false;
  }

  trackByCode(_index: number, item: ProcessCode): string {
    return item.procCode;
  }

  /**
   * Formats termination date for display
   * Returns '-' for empty/whitespace values per WCAG guidelines
   */
  getTerminationDate(termDate?: string): string {
    if (!termDate || termDate.trim() === '') {
      return '-';
    }
    const formatted = moment(termDate).format('DD-MMM-YYYY');
    return formatted.toUpperCase();
  }
}
