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
  TemplateRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { MaintainDonorInterdictionService } from './services/maintain-donor-interdiction.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { FindDonorDialog } from '@shared/components/find-donor/find-donor';
import { FindDonorDialogResult } from '@shared/components/find-donor/find-donor.model';
import { InterdictionFilterPanel } from './interdiction-filter-panel/interdiction-filter-panel';
import {
  DonorDetails,
  DonorInterdiction,
  InterdictionFilters,
  ReleaseInterdictionRequest,
  TerminateInterdictionRequest
} from './models/maintain-donor-interdiction.models';
import { AddInterdictionDialogComponent } from './dialogs/add-interdiction-dialog.component';
import { ViewInterdictionDialogComponent } from './dialogs/view-interdiction-dialog.component';
import { TerminateInterdictionDialogComponent } from './dialogs/terminate-interdiction-dialog.component';
import { ReleaseConfirmationDialogComponent } from './dialogs/release-confirmation-dialog.component';
import { TerminateConfirmationDialogComponent } from './dialogs/terminate-confirmation-dialog.component';

@Component({
  selector: 'app-maintain-donor-interdiction',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatMenuModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar,
    FilterChips
  ],
  templateUrl: './maintain-donor-interdiction.component.html',
  styleUrl: './maintain-donor-interdiction.component.scss'
})
export class MaintainDonorInterdictionComponent implements OnInit, OnDestroy {
  @ViewChild('interdictionCard', { read: ElementRef }) interdictionCard!: ElementRef<HTMLElement>;
  @ViewChild('viewActionTemplate', { static: true }) viewActionTemplate!: TemplateRef<any>;

  private readonly service = inject(MaintainDonorInterdictionService);
  private readonly dialog = inject(MatDialog);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly overlay = inject(Overlay);
  private readonly destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by code or type',
    minLength: 1,
    ariaLabel: 'Search interdictions by code or type',
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

  readonly donorDetails = signal<DonorDetails | null>(null);
  readonly interdictions = signal<DonorInterdiction[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly showFilterPanel = signal<boolean>(false);
  readonly selectedInterdiction = signal<DonorInterdiction | null>(null);
  readonly searchText = signal<string>('');
  readonly showTerminated = signal<boolean>(false);

  readonly hasDonor = computed(() => this.donorDetails() !== null);

  readonly filteredInterdictions = computed(() => {
    const all = this.interdictions();
    const search = this.searchText().toLowerCase();
    if (!search) return all;
    return all.filter(i =>
      i.interCode.toLowerCase().includes(search) ||
      i.interType.toLowerCase().includes(search) ||
      (i.interDesc && i.interDesc.toLowerCase().includes(search))
    );
  });

  readonly sortedInterdictions = signal<DonorInterdiction[]>([]);

  interdictionTableConfig: DataTableConfig<DonorInterdiction> = {
    columns: [
      { key: 'interCode', header: 'Code', sortable: true },
      { key: 'interType', header: 'Type' },
      { key: 'unitId', header: 'Unit ID' },
      { key: 'effDate', header: 'Effective Date', valueFormatter: (v: string) => this.formatDate(v) },
      { key: 'termDate', header: 'Termination Date', valueFormatter: (v: string) => v ? this.formatDate(v) : '' },
      { key: 'releaseDate', header: 'Release Date', valueFormatter: (v: string) => v ? this.formatDate(v) : '' },
      { key: 'insertUser', header: 'User ID' },
      { key: 'originatedFrom', header: 'Originated' },
      { key: 'termReason', header: 'Reason' },
      { key: 'groupMode', header: 'Group Mode' },
      { key: 'groupId', header: 'Group ID' },
      { key: 'viewAction', header: '', width: '56px' }
    ],
    rowActions: [
      {
        action: 'view',
        label: 'View Interdiction',
        icon: 'visibility'
      },
      {
        action: 'release',
        label: 'Release Interdiction',
        icon: 'lock_open',
        visible: (row: DonorInterdiction) => !!row.termDate && !row.releaseDate
      },
      {
        action: 'terminate',
        label: 'Terminate Interdiction',
        icon: 'block',
        visible: (row: DonorInterdiction) => !row.termDate
      }
    ],
    showActionsAsMenu: true,
    sortConfig: { column: '', direction: 'default' as const },
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No interdictions found.',
    enableRowHighlight: false
  };

  private filters: InterdictionFilters = {
    showTerminated: false
  };

  ngOnInit(): void {
    const viewCol = this.interdictionTableConfig.columns.find(c => c.key === 'viewAction');
    if (viewCol) {
      viewCol.cellTemplate = this.viewActionTemplate;
    }

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onReset());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  onSearchForDonor(): void {
    const dialogRef = this.dialog.open(FindDonorDialog, {
      width: '1184px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'find-donor-panel',
      disableClose: true,
      data: { programName: 'DPIPLINT' }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: FindDonorDialogResult) => {
        if (result && result.action === 'select' && result.donor) {
          this.loadDonorData(result.donor.donorId!);
        }
      });
  }

  private loadDonorData(donorId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getDonorDetails(donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          this.donorDetails.set(details);
          this.loadInterdictions(donorId);
        },
        error: (err) => {
          this.error.set(this.formatErrorMessage(err, 'Failed to load donor details'));
          this.loading.set(false);
        }
      });
  }

  private loadInterdictions(donorId?: string): void {
    const id = donorId || this.donorDetails()?.donorId;
    if (!id) return;

    this.loading.set(true);

    this.service.getInterdictions(
      id,
      this.filters.showTerminated,
      this.filters.userId,
      this.filters.originated,
      this.filters.groupMode,
      this.filters.groupId,
      this.filters.search,
      this.filters.effectiveDatePeriod,
      this.filters.effectiveDate,
      this.filters.terminationDatePeriod,
      this.filters.terminationDate
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.interdictions.set(data);
          this.sortedInterdictions.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(this.formatErrorMessage(err, 'Failed to load interdictions'));
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

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.interdictionCard)
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
      .withPush(true)
      .withViewportMargin(16)
      .withFlexibleDimensions(false)
      .withGrowAfterOpen(false);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      width: '320px',
      minWidth: '320px',
      maxWidth: '320px'
    });

    const portal = new ComponentPortal(InterdictionFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.filters;
    componentRef.instance.userIdOptions = this.getUniqueValues('insertUser');
    componentRef.instance.originatedOptions = this.getUniqueValues('originatedFrom');
    componentRef.instance.groupModeOptions = this.getUniqueValues('groupMode');
    componentRef.instance.groupIdOptions = this.getUniqueValues('groupId');

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters: InterdictionFilters) => {
        this.applyFilters(filters);
        this.closeFilterOverlay();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterOverlay();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterOverlay();
      });
  }

  private closeFilterOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.showFilterPanel.set(false);
    }
  }

  private applyFilters(filters: InterdictionFilters): void {
    this.filters = filters;
    this.updateFilterChips();
    this.loadInterdictions();
  }

  private updateFilterChips(): void {
    const chips: FilterChip[] = [];
    if (this.filters.showTerminated) {
      chips.push({ key: 'showTerminated', label: 'Show Terminated', value: true });
    }
    if (this.filters.userId) {
      chips.push({ key: 'userId', label: `User: ${this.filters.userId}`, value: this.filters.userId });
    }
    if (this.filters.originated) {
      chips.push({ key: 'originated', label: `Originated: ${this.filters.originated}`, value: this.filters.originated });
    }
    if (this.filters.groupMode) {
      chips.push({ key: 'groupMode', label: `Group Mode: ${this.filters.groupMode}`, value: this.filters.groupMode });
    }
    if (this.filters.groupId) {
      chips.push({ key: 'groupId', label: `Group ID: ${this.filters.groupId}`, value: this.filters.groupId });
    }
    if (this.filters.effectiveDate && this.filters.effectiveDatePeriod && this.filters.effectiveDate.trim()) {
      const date = moment(this.filters.effectiveDate, 'YYYY-MM-DD');
      if (date.isValid()) {
        const formattedDate = date.format('DD-MMM-YYYY').toUpperCase();
        const symbol = this.filters.effectiveDatePeriod === 'Before' ? '≤' : '≥';
        chips.push({
          key: 'effectiveDate',
          label: `Effective Date ${symbol} ${formattedDate}`,
          value: this.filters.effectiveDate
        });
      }
    }
    if (this.filters.terminationDate && this.filters.terminationDatePeriod && this.filters.terminationDate.trim()) {
      const date = moment(this.filters.terminationDate, 'YYYY-MM-DD');
      if (date.isValid()) {
        const formattedDate = date.format('DD-MMM-YYYY').toUpperCase();
        const symbol = this.filters.terminationDatePeriod === 'Before' ? '≤' : '≥';
        chips.push({
          key: 'terminationDate',
          label: `Termination Date ${symbol} ${formattedDate}`,
          value: this.filters.terminationDate
        });
      }
    }
    this.filterChips = chips;
  }

  onRemoveFilterChip(chipKey: string): void {
    const key = chipKey as keyof InterdictionFilters;
    if (key === 'showTerminated') {
      this.filters = { ...this.filters, showTerminated: false };
    } else if (key === 'effectiveDate') {
      this.filters = { ...this.filters, effectiveDate: undefined, effectiveDatePeriod: undefined };
    } else if (key === 'terminationDate') {
      this.filters = { ...this.filters, terminationDate: undefined, terminationDatePeriod: undefined };
    } else {
      this.filters = { ...this.filters, [key]: undefined };
    }
    this.updateFilterChips();
    this.loadInterdictions();
  }

  clearAllFilters(): void {
    this.filters = { showTerminated: false };
    this.filterChips = [];
    this.loadInterdictions();
  }

  hasActiveFilters(): boolean {
    return this.filters.showTerminated ||
      !!this.filters.userId ||
      !!this.filters.originated ||
      !!this.filters.groupMode ||
      !!this.filters.groupId ||
      !!(this.filters.effectiveDate && this.filters.effectiveDatePeriod) ||
      !!(this.filters.terminationDate && this.filters.terminationDatePeriod);
  }

  onToggleShowTerminated(): void {
    this.showTerminated.update(v => !v);
    this.filters.showTerminated = this.showTerminated();
    this.loadInterdictions();
  }

  onSearchChange(value: string): void {
    this.searchText.set(value);
    const filtered = this.filteredInterdictions();
    this.sortedInterdictions.set(filtered);
  }

  onAddNewInterdiction(): void {
    const donor = this.donorDetails();
    if (!donor) return;

    const dialogRef = this.dialog.open(AddInterdictionDialogComponent, {
      disableClose: true,
      width: '580px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'code-dialog-panel-right',
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: { donorId: donor.donorId }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: { success: boolean; addAnother?: boolean; interCode?: string } | undefined) => {
        if (result?.success) {
          const message = result.interCode
            ? `Interdiction ${result.interCode} added successfully`
            : 'Interdiction added successfully';
          this.snackbarService.showSuccess(message);
          this.loadInterdictions();
          if (result.addAnother) {
            this.onAddNewInterdiction();
          }
        }
      });
  }

  onInterdictionSort(event: TableSortEvent): void {
    this.interdictionTableConfig = {
      ...this.interdictionTableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };

    if (event.direction === 'default') {
      this.sortedInterdictions.set(this.filteredInterdictions());
      return;
    }

    const dir = event.direction === 'D' ? -1 : 1;
    const sorted = [...this.sortedInterdictions()].sort((a, b) => {
      const valA = (a[event.column as keyof DonorInterdiction] ?? '').toString().toLowerCase();
      const valB = (b[event.column as keyof DonorInterdiction] ?? '').toString().toLowerCase();
      return valA.localeCompare(valB, undefined, { numeric: true }) * dir;
    });
    this.sortedInterdictions.set(sorted);
  }

  onInterdictionAction(event: TableRowActionEvent<DonorInterdiction>): void {
    switch (event.action) {
      case 'view':
        this.onView(event.row);
        break;
      case 'release':
        this.onRelease(event.row);
        break;
      case 'terminate':
        this.onTerminate(event.row);
        break;
    }
  }

  onView(interdiction: DonorInterdiction): void {
    this.dialog.open(ViewInterdictionDialogComponent, {
      disableClose: true,
      width: '480px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'code-dialog-panel-right',
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: { interdiction }
    });
  }

  onRelease(interdiction: DonorInterdiction): void {
    const confirmRef = this.dialog.open(ReleaseConfirmationDialogComponent, {
      width: '450px'
    });

    confirmRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed === true) {
          this.performRelease(interdiction);
        }
      });
  }

  private performRelease(interdiction: DonorInterdiction): void {
    const request: ReleaseInterdictionRequest = {
      donorId: interdiction.donorId,
      interCode: interdiction.interCode,
      unitId: interdiction.unitId || undefined,
      effDate: interdiction.effDate,
      originatedFrom: interdiction.originatedFrom || undefined,
      groupMode: interdiction.groupMode || undefined,
      groupId: interdiction.groupId || undefined,
      reasonCode: interdiction.reasonCode || undefined,
      termDate: interdiction.termDate || undefined
    };

    this.loading.set(true);

    this.service.releaseInterdiction(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.snackbarService.showSuccess('Interdiction released successfully');
          this.loadInterdictions();
        },
        error: (err) => {
          this.loading.set(false);
          this.snackbarService.showError(
            this.formatErrorMessage(err, 'Failed to release interdiction')
          );
        }
      });
  }

  onTerminate(interdiction: DonorInterdiction): void {
    const dialogRef = this.dialog.open(TerminateInterdictionDialogComponent, {
      disableClose: true,
      width: '580px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'code-dialog-panel-right',
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: { interdiction, donorId: this.donorDetails()?.donorId }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: { success: boolean } | undefined) => {
        if (result?.success) {
          this.snackbarService.showSuccess('Interdiction terminated successfully');
          this.loadInterdictions();
        }
      });
  }

  onReset(): void {
    this.donorDetails.set(null);
    this.interdictions.set([]);
    this.sortedInterdictions.set([]);
    this.error.set(null);
    this.searchText.set('');
    this.showTerminated.set(false);
    this.showFilterPanel.set(false);
    this.filters = { showTerminated: false };
    this.filterChips = [];
    this.closeFilterOverlay();
  }

  formatDate(dateString: string): string {
    const m = moment(dateString, 'YYYY-MM-DD');
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }

  private getUniqueValues(field: keyof DonorInterdiction): string[] {
    const values = this.interdictions()
      .map(i => i[field])
      .filter((v): v is string => !!v);
    return [...new Set(values)].sort();
  }

  private formatErrorMessage(
    err: { error?: { errorCode?: string; message?: string; errorResponse?: { error?: string } }; message?: string },
    fallback: string
  ): string {
    const errorCode = err?.error?.errorCode;
    const message = err?.error?.message || err?.error?.errorResponse?.error || err?.message || fallback;
    return errorCode ? `${errorCode}: ${message}` : message;
  }
}
