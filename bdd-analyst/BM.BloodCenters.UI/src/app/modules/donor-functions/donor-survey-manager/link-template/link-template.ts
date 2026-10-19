import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject, takeUntil } from 'rxjs';
import { first, finalize } from 'rxjs/operators';
import moment from 'moment';

import { TemplateLinkService } from './services/template-link.service';
import { TemplateLinkModel, TemplateLinkDialogResult, TemplateLinkSavePayload } from './models/template-link.model';

import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { ROUTES } from '../../../../core/constants/route.constants';
import { ROUTE_REGISTRY } from '../../../../core/constants/route-registry';
import { RouteKey } from '../../../../core/constants/route-keys';
import { removePathPrefix } from '../../../../core/utils/route-utils';
import { HeaderService } from '@shared/services/header.service';
import { AddEditLinkDialog } from './add-edit-link-dialog/add-edit-link-dialog';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SurveyTemplateFilterValue } from '../survey-template/models/survey-template.model';
import { SurveyTemplateFilterChipsUtils } from '../survey-template/utils/filter-chips.utils';
import { TemplateFilterPanel } from '../survey-template/template-filter-panel/template-filter-panel';

/**
 * LinkTemplateComponent
 * Main component for managing template links (category codes and values)
 */
@Component({
  selector: 'app-link-template',
  standalone: true,
  imports: [
    CommonModule,
    AddEditLinkDialog,
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    DataTable,
    FilterChips,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './link-template.html',
  styleUrls: ['./link-template.scss']
})
export class LinkTemplateComponent implements OnInit, OnDestroy {

  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild(DataTable) dataTableRef?: DataTable<TemplateLinkModel>;

  templateId: string | null = null;
  chapterId: string = '';

  appliedFilters: SurveyTemplateFilterValue | null = null;
  filterChips: FilterChip[] = [];
  isFilterOpen = false;
  private overlayRef: OverlayRef | null = null;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: ROUTES.HOME },
      {
        label: 'Donor Survey Manager',
        link: `/donor-functions/${removePathPrefix(
          ROUTE_REGISTRY[RouteKey.DonorSurveyManager].path,
          '/donor-functions',
        )}/survey-template`,
      },
      { label: 'Link Template', link: null }
    ],
    title: 'Link Template',
    subtitle: '',
    actions: [
      {
        label: 'ADD NEW LINK',
        icon: 'add',
        color: 'accent',
        matButton: 'raised',
        ariaLabel: 'Add new link',
        onClick: () => this.openAddPanel()
      }
    ],
    showBackButton: true,
    onBackClick: () => this.navigateBack()
  };

  tableConfig: DataTableConfig<TemplateLinkModel> = {
    columns: [],
    rowActions: [],
    sortConfig: {
      column: 'groupId',
      direction: 'A'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    showActionsAsMenu: false,
    enableRowHighlight: false,
    noDataIcon: 'edit',
    emptyMessage: 'No template links found',
    loadingMessage: 'Loading template links...',
    showPagination: false
  };

  // Data
  allData: TemplateLinkModel[] = [];
  dataSource: TemplateLinkModel[] = [];

  isLoading = false;

  /** Side panel (same pattern as Create and Maintain Territories) */
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelLink: TemplateLinkModel | null = null;
  sidePanelResetToken = 0;
  sidePanelSubmitting = false;

  private destroy$ = new Subject<void>();

  constructor(
    private templateLinkService: TemplateLinkService,
    private overlay: Overlay,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute,
    private headerService: HeaderService
  ) {
    this.initializeTableConfig();
  }

  ngOnInit(): void {
    // Get chapterId from HeaderService (signal)
    this.chapterId = this.headerService.chapterId() || '';

    this.subscribeToChapterChanges();

    // Get templateId from query params
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.templateId = params['templateId'];
        if (this.templateId) {
          this.headerConfig.title = `Link Template - ${this.templateId}`;
          this.loadData();
        } else {
          this.snackBar.open('Template ID is required', 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          this.navigateBack();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  private initializeTableConfig(): void {
    this.tableConfig.columns = [
      {
        key: 'groupId',
        header: 'Group ID',
        sortable: true,
        width: '120px',
        type: 'text'
      },
      {
        key: 'categoryCode',
        header: 'Category Code',
        sortable: false,
        width: '150px',
        type: 'text'
      },
      {
        key: 'categoryValues',
        header: 'Category Values',
        sortable: false,
        width: '250px',
        type: 'text',
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        sortable: false,
        width: '150px',
        type: 'date',
        valueFormatter: (value) => this.templateLinkService.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        sortable: false,
        width: '150px',
        type: 'date',
        valueFormatter: (value) => this.templateLinkService.formatDate(value)
      }
    ];

    this.tableConfig.rowActions = [
      {
        icon: 'edit',
        label: 'Edit Link',
        action: 'edit'
      }
    ];
  }

  /**
   * Load all template links
   */
  loadData(): void {
    if (!this.templateId || !this.chapterId) return;

    this.isLoading = true;
    this.templateLinkService.getTemplateLinks(this.chapterId, this.templateId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (data) => {
          this.allData = data;
          this.applyClientSideFiltering();
        }
      });
  }

  /**
   * Apply client-side filtering and sorting
   */
  private applyClientSideFiltering(): void {
    let filtered = [...this.allData];

    if (this.appliedFilters) {
      if (this.appliedFilters.effDate && this.appliedFilters.effDatePeriod) {
        const filterDate = moment(this.appliedFilters.effDate).startOf('day');
        filtered = filtered.filter((item) => {
          const itemDate = moment(item.effDate).startOf('day');
          if (this.appliedFilters!.effDatePeriod === 'after') {
            return itemDate.isSameOrAfter(filterDate);
          }
          return itemDate.isSameOrBefore(filterDate);
        });
      }

      if (this.appliedFilters.termDate && this.appliedFilters.termDatePeriod) {
        const filterDate = moment(this.appliedFilters.termDate).startOf('day');
        filtered = filtered.filter((item) => {
          if (!item.termDate) return false;
          const itemDate = moment(item.termDate).startOf('day');
          if (this.appliedFilters!.termDatePeriod === 'after') {
            return itemDate.isSameOrAfter(filterDate);
          }
          return itemDate.isSameOrBefore(filterDate);
        });
      }
    }

    // Apply sorting
    if (this.tableConfig.sortConfig) {
      const { column, direction } = this.tableConfig.sortConfig;
      if (direction !== 'default' && column === 'groupId') {
        filtered.sort((a, b) => {
          const aVal = a.groupId || '';
          const bVal = b.groupId || '';
          const comparison = aVal.localeCompare(bVal);
          return direction === 'A' ? comparison : -comparison;
        });
      }
    }

    this.dataSource = filtered;
  }

  openFilter(): void {
    if (this.isFilterOpen) {
      this.closeFilter();
      return;
    }

    const btnRect = this.filterBtn.nativeElement.getBoundingClientRect();
    const cardRect = this.tableCard.nativeElement.getBoundingClientRect();
    const offsetY = btnRect.bottom - cardRect.top;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.tableCard)
      .withPositions([
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'top', offsetY },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.block(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      width: '320px',
    });

    const filterPanelPortal = new ComponentPortal(TemplateFilterPanel);
    const filterPanelRef = this.overlayRef.attach(filterPanelPortal);

    filterPanelRef.instance.currentFilters = this.appliedFilters;
    filterPanelRef.instance.showStatus = false;
    filterPanelRef.instance.apply
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe((filters) => this.applyFilters(filters));

    filterPanelRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeFilter());

    this.overlayRef
      .backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeFilter());

    this.isFilterOpen = true;
  }

  closeFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
  }

  applyFilters(filters: SurveyTemplateFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = SurveyTemplateFilterChipsUtils.convertFiltersToChips(filters);
    this.closeFilter();
    this.applyClientSideFiltering();
  }

  onRemoveFilterChip(chipKey: string): void {
    if (this.appliedFilters) {
      this.appliedFilters = SurveyTemplateFilterChipsUtils.removeFilterByChipKey(
        this.appliedFilters,
        chipKey,
      );
      if (!SurveyTemplateFilterChipsUtils.hasActiveFilters(this.appliedFilters)) {
        this.appliedFilters = null;
      }
      this.filterChips = this.appliedFilters
        ? SurveyTemplateFilterChipsUtils.convertFiltersToChips(this.appliedFilters)
        : [];
      this.applyClientSideFiltering();
    }
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.applyClientSideFiltering();
  }

  hasActiveFilters(): boolean {
    return SurveyTemplateFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.chapterId = this.headerService.chapterId() || '';
        this.closeFilter();
        this.closeSidePanel();
        this.appliedFilters = null;
        this.filterChips = [];
        this.loadData();
      });
  }

  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.direction = event.direction;
      this.tableConfig.sortConfig.column = event.column;
    }
    this.applyClientSideFiltering();
  }

  onRowAction(event: TableRowActionEvent<TemplateLinkModel>): void {
    if (event.action === 'edit') {
      this.openEditPanel(event.row);
    }
  }

  openAddPanel(): void {
    if (!this.templateId) return;

    this.sidePanelMode = 'add';
    this.sidePanelLink = null;
    this.sidePanelOpen = true;
    if (this.dataTableRef) this.dataTableRef.activeRow = null;
  }

  openEditPanel(link: TemplateLinkModel): void {
    if (!this.templateId) return;

    this.sidePanelMode = 'edit';
    this.sidePanelLink = link;
    this.sidePanelOpen = true;
    if (this.dataTableRef) this.dataTableRef.activeRow = link;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelLink = null;
    if (this.dataTableRef) this.dataTableRef.activeRow = null;
  }

  onLinkPanelSave(result: TemplateLinkDialogResult): void {
    if (!result?.data) return;

    const isAddMode = result.mode === 'add';
    const keepPanelOpen = isAddMode && result.action === 'saveAndCreateAnother';

    if (isAddMode) {
      this.createLink(result.data, keepPanelOpen);
      return;
    }

    this.updateLink(result.data);
  }

  /**
   * Create new template link
   */
  private createLink(data: TemplateLinkSavePayload, keepPanelOpen = false): void {
    if (!this.templateId || !this.chapterId) return;

    this.sidePanelSubmitting = true;
    this.templateLinkService.createTemplateLink(this.chapterId, this.templateId, data)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.sidePanelSubmitting = false;
        })
      )
      .subscribe({
        next: (response) => {
          const message = response?.message || 'Link created successfully';
          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          if (keepPanelOpen) {
            this.sidePanelMode = 'add';
            this.sidePanelLink = null;
            this.sidePanelResetToken += 1;
          } else {
            this.closeSidePanel();
          }
          this.loadData();
        }
      });
  }

  /**
   * Update existing template link
   * Old values (WHERE) and new values (SET) are both in the payload body
   */
  private updateLink(data: TemplateLinkSavePayload): void {
    if (!this.templateId || !this.chapterId) return;

    this.sidePanelSubmitting = true;
    this.templateLinkService.updateTemplateLink(
      this.chapterId,
      this.templateId,
      data  // Body contains both old values (WHERE) and new values (SET)
    )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.sidePanelSubmitting = false;
        })
      )
      .subscribe({
        next: (response) => {
          const message = response?.message || 'Link updated successfully';
          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
          });
          this.closeSidePanel();
          this.loadData();
        }
      });
  }

  /**
   * Navigate back to All Survey Templates (DSM tabbed shell).
   */
  navigateBack(): void {
    const dsmSegment = removePathPrefix(
      ROUTE_REGISTRY[RouteKey.DonorSurveyManager].path,
      '/donor-functions',
    );
    this.router.navigate(['/donor-functions', dsmSegment, 'survey-template']);
  }

  // Keyboard Shortcuts
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.altKey && event.key === 'n') {
      event.preventDefault();
      this.openAddPanel();
    } else if (event.altKey && event.key === 'b') {
      event.preventDefault();
      this.navigateBack();
    } else if (event.altKey && event.key === 'f') {
      event.preventDefault();
      this.openFilter();
    } else if (event.key === 'Escape') {
      if (this.isFilterOpen) {
        this.closeFilter();
      } else if (this.sidePanelOpen) {
        this.closeSidePanel();
      }
    }
  }
}
