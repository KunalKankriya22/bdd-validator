import {
  Component, OnInit, OnDestroy, inject, signal, computed, effect,
  ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { MaintainDonorAttributesService } from './services/maintain-donor-attributes.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SearchForDonorDialog } from '@shared/components/search-for-donor/search-for-donor';
import { SearchForDonorDialogResult } from '@shared/components/search-for-donor/search-for-donor.model';
import { AttributeFilterPanel } from './attribute-filter-panel/attribute-filter-panel';
import { AttributeFilterChipsUtils } from './utils/filter-chips.utils';
import {
  MaintainDonorAttributeDonorDetails,
  MaintainDonorAttribute,
  AttributeFilters,
  BulkTerminateMaintainDonorAttributeRequest
} from './models/maintain-donor-attributes.models';
import { AddAttributeDialogComponent } from './dialogs/add-attribute-dialog.component';
import { EditAttributeDialogComponent } from './dialogs/edit-attribute-dialog.component';
import { RemoveConfirmationDialogComponent } from './dialogs/remove-confirmation-dialog.component';

@Component({
  selector: 'app-maintain-donor-attributes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule,
    PageHeaderWithBreadcrumb, DataTable, SearchBar, FilterChips
  ],
  templateUrl: './maintain-donor-attributes.component.html',
  styleUrl: './maintain-donor-attributes.component.scss'
})
export class MaintainDonorAttributesComponent implements OnInit, OnDestroy {
  @ViewChild('attributesCard', { read: ElementRef }) attributesCard!: ElementRef<HTMLElement>;
  @ViewChild('filterButton', { read: ElementRef }) filterButtonRef!: ElementRef<HTMLElement>;
  @ViewChild(DataTable) attributeTable!: DataTable<MaintainDonorAttribute>;

  private readonly service = inject(MaintainDonorAttributesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly overlay = inject(Overlay);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();
  overlayRef: OverlayRef | null = null;

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by code or description',
    minLength: 1,
    ariaLabel: 'Search attributes by code or description',
    searchOnEnterOnly: true,
    alwaysShowTooltip: false
  };

  filterChips: FilterChip[] = [];

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
    actions: [
      {
        label: 'SEARCH FOR DONOR',
        icon: 'search',
        matButton: 'raised',
        ariaLabel: 'Search for a donor',
        onClick: () => this.onSearchForDonor()
      }
    ]
  };

  constructor() {
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
          subtitle: pageData.subtitle
        };
      }
    });
  }

  readonly donorDetails = signal<MaintainDonorAttributeDonorDetails | null>(null);
  readonly attributes = signal<MaintainDonorAttribute[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly showFilterPanel = signal<boolean>(false);
  readonly searchText = signal<string>('');
  readonly selectedItems = signal<MaintainDonorAttribute[]>([]);
  readonly editDialogOpen = signal<boolean>(false);

  readonly hasDonor = computed(() => this.donorDetails() !== null);

  readonly filteredAttributes = computed(() => {
    const all = this.attributes();
    const search = this.searchText().toLowerCase();
    if (!search) return all;
    return all.filter(a =>
      a.interCode.toLowerCase().includes(search) ||
      (a.interDesc && a.interDesc.toLowerCase().includes(search))
    );
  });

  readonly sortedAttributes = signal<MaintainDonorAttribute[]>([]);

  attributeTableConfig: DataTableConfig<MaintainDonorAttribute> = {
    columns: [
      { key: 'interCode', header: 'Code', sortable: true, width: '100px' },
      { key: 'interDesc', header: 'Description' },
      { key: 'effDate', header: 'Effective Date', valueFormatter: (v: string) => this.formatDate(v) },
      { key: 'termDate', header: 'Termination Date', valueFormatter: (v: string) => v ? this.formatDate(v) : '' },
      { key: 'insertUser', header: 'User ID' }
    ],
    rowActions: [
      {
        action: 'edit',
        label: 'Edit Attribute',
        icon: 'edit',
        visible: (row: MaintainDonorAttribute) => !row.termDate
      }
    ],
    showActionsAsMenu: false,
    sortConfig: { column: 'interCode', direction: 'A' as const },
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No attributes found.',
    noDataIcon: 'search',
    enableRowHighlight: false,
    enableSelection: true,
    selectionPosition: 'first',
    selectionKey: 'interCode',
    isRowSelectable: (row: MaintainDonorAttribute) => {
      if (!row.termDate) return true;
      const termDate = moment(row.termDate, ['YYYY-MM-DD', moment.ISO_8601]);
      const chapterToday = this.chapterTimezoneService.getChapterLocalDate().startOf('day');
      return termDate.isValid() && termDate.isAfter(chapterToday, 'day');
    }
  };

  appliedFilters: AttributeFilters | null = null;

  ngOnInit(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onReset());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.overlayRef) this.overlayRef.dispose();
  }

  onSearchForDonor(): void {
    const dialogRef = this.dialog.open(SearchForDonorDialog, {
      width: '1150px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: true,
      position: { right: '0', top: '64px' },
      panelClass: 'right-side-dialog',
      hasBackdrop: true,
      autoFocus: 'first-tabbable'
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: SearchForDonorDialogResult) => {
        if (result && result.action === 'select' && result.donor) {
          this.loadDonorData(result.donor.donorId);
        }
      });
  }

  private loadDonorData(donorId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedItems.set([]);

    this.service.getDonorDetails(donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          this.donorDetails.set(details);
          this.loadAttributes(donorId);
        },
        error: (err) => {
          this.error.set(this.formatErrorMessage(err, 'Failed to load donor details'));
          this.loading.set(false);
        }
      });
  }

  private loadAttributes(donorId?: string): void {
    const id = donorId || this.donorDetails()?.donorId;
    if (!id) return;

    this.loading.set(true);

    const f = this.appliedFilters;
    const showTerminated = f?.showTerminated ?? false;
    const effDateAfter = f?.effDatePeriod === 'after' ? f.effDate : undefined;
    const effDateBefore = f?.effDatePeriod === 'before' ? f.effDate : undefined;
    const termDateBefore = f?.termDatePeriod === 'before' ? f.termDate : undefined;
    const termDateAfter = f?.termDatePeriod === 'after' ? f.termDate : undefined;

    this.service.getAttributes(id, showTerminated, effDateAfter, effDateBefore, termDateBefore, termDateAfter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.attributes.set(data);
          this.sortedAttributes.set(this.sortByInterCodeAsc(this.filteredAttributes()));
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(this.formatErrorMessage(err, 'Failed to load attributes'));
          this.loading.set(false);
        }
      });
  }

  onToggleFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.showFilterPanel.set(false);
      return;
    }

    this.showFilterPanel.set(true);

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterButtonRef)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 },
        { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      panelClass: 'filter-panel-overlay',
    });

    const portal = new ComponentPortal(AttributeFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters: AttributeFilters) => {
        this.applyFilters(filters);
        this.closeFilterOverlay();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeFilterOverlay());

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeFilterOverlay());
  }

  private closeFilterOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.showFilterPanel.set(false);
      // Return focus to the filter button after closing the panel
      this.filterButtonRef?.nativeElement?.focus();
    }
  }

  applyFilters(filters: AttributeFilters): void {
    this.appliedFilters = filters;
    this.filterChips = AttributeFilterChipsUtils.convertFiltersToChips(filters);
    this.loadAttributes();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = AttributeFilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);
    this.filterChips = AttributeFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    this.loadAttributes();
  }

  onClearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.loadAttributes();
  }

  hasActiveFilters(): boolean {
    return AttributeFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  onSearchChange(value: string): void {
    this.searchText.set(value);
    this.sortedAttributes.set(this.sortByInterCodeAsc(this.filteredAttributes()));
  }

  onAddNewAttribute(): void {
    const donor = this.donorDetails();
    if (!donor) return;

    const dialogRef = this.dialog.open(AddAttributeDialogComponent, {
      disableClose: true,
      width: '580px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'code-dialog-panel-right',
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      ariaLabelledBy: 'add-attr-title',
      data: { donorId: donor.donorId }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: { success: boolean; interCode?: string } | undefined) => {
        if (result?.success) {
          this.snackbarService.showSuccess(`New attribute ${result.interCode || ''} added successfully.`);
          this.loadAttributes();
        }
      });
  }

  private sortByInterCodeAsc(data: MaintainDonorAttribute[]): MaintainDonorAttribute[] {
    return [...data].sort((a, b) =>
      (a.interCode ?? '').toLowerCase().localeCompare((b.interCode ?? '').toLowerCase(), undefined, { numeric: true })
    );
  }

  onAttributeSort(event: TableSortEvent): void {
    this.attributeTableConfig = {
      ...this.attributeTableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };

    if (event.direction === 'default') {
      this.sortedAttributes.set(this.sortByInterCodeAsc(this.filteredAttributes()));
      return;
    }

    const dir = event.direction === 'D' ? -1 : 1;
    const sorted = [...this.sortedAttributes()].sort((a, b) => {
      const valA = (a[event.column as keyof MaintainDonorAttribute] ?? '').toString().toLowerCase();
      const valB = (b[event.column as keyof MaintainDonorAttribute] ?? '').toString().toLowerCase();
      return valA.localeCompare(valB, undefined, { numeric: true }) * dir;
    });
    this.sortedAttributes.set(sorted);
  }

  onAttributeAction(event: TableRowActionEvent<MaintainDonorAttribute>): void {
    if (event.action === 'edit') {
      this.onEditAttribute(event.row);
    }
  }

  onEditAttribute(attribute: MaintainDonorAttribute): void {
    const donor = this.donorDetails();
    if (!donor) return;

    const prevSelectedIds = new Set(this.attributeTable.selectedIds);
    this.clearTableSelection();

    this.attributeTable.activeRow = attribute;
    this.editDialogOpen.set(true);

    const dialogRef = this.dialog.open(EditAttributeDialogComponent, {
      disableClose: true,
      width: '580px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'code-dialog-panel-right',
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      ariaLabelledBy: 'edit-attr-title',
      data: { donorId: donor.donorId, attribute, chapterToday: this.chapterTimezoneService.getChapterLocalDate().startOf('day').format('YYYY-MM-DD') }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: { success: boolean } | undefined) => {
        this.attributeTable.activeRow = null;
        this.editDialogOpen.set(false);
        this.attributeTable.selectedIds = prevSelectedIds;
        this.attributeTable.selectedRows = this.sortedAttributes().filter(
          r => prevSelectedIds.has(r.interCode)
        );
        this.selectedItems.set(this.attributeTable.selectedRows);
        if (result?.success) {
          this.snackbarService.showSuccess(`Attribute ${attribute.interCode} updated successfully.`);
          this.loadAttributes();
        }
      });
  }

  onSelectionChange(selected: MaintainDonorAttribute[]): void {
    this.selectedItems.set(selected);
  }

  private clearTableSelection(): void {
    this.selectedItems.set([]);
    if (this.attributeTable) {
      this.attributeTable.selectedRows = [];
      this.attributeTable.selectedIds.clear();
      this.attributeTable.isAllSelected = false;
      this.attributeTable.isAllPagesSelected = false;
    }
  }

  onRemoveSelected(): void {
    const items = this.selectedItems();
    if (items.length === 0) return;

    const confirmRef = this.dialog.open(RemoveConfirmationDialogComponent, {
      width: '550px',
      role: 'alertdialog',
      ariaLabelledBy: 'confirm-title',
      ariaDescribedBy: 'confirm-desc'
    });

    confirmRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed === true) {
          this.performBulkTerminate(items);
        }
      });
  }

  private performBulkTerminate(items: MaintainDonorAttribute[]): void {
    const donor = this.donorDetails();
    if (!donor) return;

    this.loading.set(true);

    const request: BulkTerminateMaintainDonorAttributeRequest = {
      items: items.map(item => ({
        interCode: item.interCode,
        effDate: item.effDate,
        interType: item.interType || undefined
      }))
    };

    this.service.bulkTerminate(donor.donorId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.snackbarService.showSuccess('Attributes removed successfully.');
          this.clearTableSelection();
          this.loadAttributes();
        },
        error: (err) => {
          this.loading.set(false);
          this.snackbarService.showError(this.formatErrorMessage(err, 'Failed to remove attributes'));
        }
      });
  }

  onReset(): void {
    this.donorDetails.set(null);
    this.attributes.set([]);
    this.sortedAttributes.set([]);
    this.error.set(null);
    this.searchText.set('');
    this.showFilterPanel.set(false);
    this.appliedFilters = null;
    this.filterChips = [];
    this.clearTableSelection();
    this.closeFilterOverlay();
  }

  formatDate(dateString: string): string {
    const m = moment(dateString, ['YYYY-MM-DD', moment.ISO_8601]);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }

  private formatErrorMessage(
    err: { error?: { errorCode?: string; message?: string; errorResponse?: { error?: string } }; message?: string },
    fallback: string
  ): string {
    const errorCode = err?.error?.errorCode;
    const message = err?.error?.message || err?.error?.errorResponse?.error || err?.message || fallback;
    return errorCode ? `Err:${errorCode} - ${message}` : message;
  }
}
