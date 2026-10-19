import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule, MatTooltip } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { OverlayModule } from '@angular/cdk/overlay';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips } from '@shared/components/filter-chips/filter-chips';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';

import { MaintainDriveLocationService } from './services/maintain-drive-location.service';
import { MaintainDriveLocationFilterPanel } from './filter-panel/filter-panel';
import { AddEditDriveLocationComponent } from './add-edit-drive-location/add-edit-drive-location';
import { DriveLocationInternationalAddressComponent } from './international-address/international-address';
import { ViewDirectionComponent } from './view-direction/view-direction';
import { ViewContactAddressComponent } from './view-contact-address/view-contact-address';
import { ViewInternationalAddressComponent } from './view-international-address/view-international-address';
import {
  DriveLocation,
  DriveLocationFilterFormValue,
  DriveLocationSearchParams,
  FilterChip
} from './models/maintain-drive-location.model';
import { MaintainDriveLocationFilterChipsUtils } from './utils/filter-chips.utils';
import { MAINTAIN_DRIVE_LOCATION_MESSAGES } from './constants/error-messages.constants';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

@Component({
  selector: 'app-maintain-drive-location',
  standalone: true,
  imports: [
    CommonModule,
    A11yModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatMenuModule,
    MatTooltipModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    FilterChips,
    LoadingSpinnerComponent,
    MaintainDriveLocationFilterPanel,
    AddEditDriveLocationComponent,
    DriveLocationInternationalAddressComponent,
    ViewDirectionComponent,
    ViewContactAddressComponent,
    ViewInternationalAddressComponent
  ],
  templateUrl: './maintain-drive-location.html',
  styleUrls: ['./maintain-drive-location.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MatPaginatorIntl,
      useFactory: () => {
        const intl = new MatPaginatorIntl();
        intl.itemsPerPageLabel = 'Rows per page:';
        intl.getRangeLabel = (page: number, pageSize: number, length: number): string => {
          const start = page * pageSize + 1;
          const end = Math.min((page + 1) * pageSize, length);
          return length === 0 ? 'No drive locations' : `${start}–${end} of ${length} drive locations`;
        };
        return intl;
      }
    }
  ]
})
export class MaintainDriveLocationComponent implements OnInit, OnDestroy {
  // Data
  dataSource = signal<DriveLocation[]>([]);
  totalRecords = signal<number>(0);

  // UI States
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Filter States
  isFilterOpen = signal<boolean>(false);
  appliedFilters = signal<DriveLocationFilterFormValue | null>(null);
  filterChips = signal<FilterChip[]>([]);

  // Search State
  searchText = signal<string>('');

  // Pagination
  pageSize = 25;
  pageIndex = 0;

  // Sorting (default: Location Type ascending)
  sortField: string | null = 'locationType';
  sortDirection: 'ASC' | 'DESC' = 'ASC';

  // Expandable Rows
  expandedRows = new Set<number>();
  allRowsExpanded = false;

  // Side Panel State
  isSidePanelOpen = signal<boolean>(false);
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: DriveLocation | null = null;
  sidePanelView: 'form' | 'international-address' | 'view-direction' | 'view-contact-address' | 'view-international-address' = 'form';
  internationalAddressRecordKey: string | null = null;
  hasUSAddressData: boolean = false;
  appliedInternationalAddressData: any = null;

  // View Panel Data
  viewDirectionData: { locationId: string; locationName: string; directions: string } | null = null;
  viewContactAddressData: any = null;
  viewInternationalAddressData: any = null;

  // Cleanup
  private destroy$ = new Subject<void>();

  // Configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Location ID, Type and Draw Site',
    minLength: 3,
    ariaLabel: 'Search drive locations',
    alwaysShowTooltip: true,
    searchOnEnterOnly: true
  };

  constructor(
    private maintainDriveLocationService: MaintainDriveLocationService,
    public chapterTimezoneService: ChapterTimezoneService,
    private headerService: HeaderService,
    private pageHeaderService: PageHeaderService,
    private snackbarService: SnackbarService,
    private dialog: MatDialog,
    private liveAnnouncer: LiveAnnouncer
  ) {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
          actions: [
            {
              label: 'ADD NEW DRIVE LOCATION',
              icon: 'add',
              matButton: 'raised',
              color: 'primary',
              onClick: () => this.openAddPanel()
            }
          ]
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load drive locations from API
   */
  loadData(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    const skip = this.pageIndex * this.pageSize;
    const params = this.buildSearchParams();

    this.maintainDriveLocationService
      .searchDriveLocations(this.pageSize, skip, params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          this.dataSource.set(response.data);
          this.totalRecords.set(response.totalRecords);
          const count = response.totalRecords;
          this.liveAnnouncer.announce(
            `Found ${count} ${count === 1 ? 'drive location' : 'drive locations'}`,
            'polite'
          );
        },
        error: (error) => {
          console.error('Error loading drive locations:', error);
          this.hasError.set(true);
          this.errorMessage.set(MAINTAIN_DRIVE_LOCATION_MESSAGES.LOAD_ERROR);
          this.liveAnnouncer.announce('Error loading drive locations', 'assertive');
        }
      });
  }

  /**
   * Build search parameters from current state
   */
  private buildSearchParams(): DriveLocationSearchParams {
    const filters = this.appliedFilters();
    return {
      searchKeyword: this.searchText() || null,
      chapterId: this.headerService.getCurrentChapterId() || null,
      showTerminated: filters?.showTerminated ?? false,
      effDate: this.formatDateOnly(filters?.effDate),
      effDatePeriod: filters?.effDatePeriod || null,
      termDate: this.formatDateOnly(filters?.termDate),
      termDatePeriod: filters?.termDatePeriod || null,
      sortField: this.sortField,
      sortDirection: this.sortDirection
    };
  }

  /**
   * Format date to YYYY-MM-DD (date only, no time/timezone)
   * DB stores dates as 2011-11-23 00:00:00.000, so we send date-only
   */
  private formatDateOnly(date: any): string | null {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Handle search input
   */
  onSearch(searchText: string): void {
    this.searchText.set(searchText);
    this.pageIndex = 0; // Reset to first page
    this.loadData();
  }

  /**
   * Toggle filter panel visibility
   */
  toggleFilter(): void {
    this.isFilterOpen.set(!this.isFilterOpen());
  }

  /**
   * Apply filters from filter panel
   */
  applyFilters(filters: DriveLocationFilterFormValue): void {
    this.appliedFilters.set(filters);
    this.filterChips.set(MaintainDriveLocationFilterChipsUtils.convertFiltersToChips(filters));
    this.isFilterOpen.set(false);
    this.pageIndex = 0; // Reset to first page
    this.liveAnnouncer.announce('Filters applied', 'polite');
    this.loadData();
  }

  /**
   * Remove individual filter chip
   */
  removeFilterChip(chipKey: string): void {
    const currentFilters = this.appliedFilters();
    if (currentFilters) {
      const updatedFilters = MaintainDriveLocationFilterChipsUtils.removeFilterByChipKey(
        currentFilters,
        chipKey
      );
      this.appliedFilters.set(updatedFilters);
      this.filterChips.set(MaintainDriveLocationFilterChipsUtils.convertFiltersToChips(updatedFilters));
      this.loadData();
    }
  }

  /**
   * Clear all filters
   */
  clearAllFilters(): void {
    this.appliedFilters.set({
      effDate: null,
      effDatePeriod: null,
      termDate: null,
      termDatePeriod: null,
      showTerminated: false
    });
    this.filterChips.set([]);
    this.pageIndex = 0;
    this.loadData();
  }

  /**
   * Check if filters are active
   */
  hasActiveFilters(): boolean {
    return MaintainDriveLocationFilterChipsUtils.hasActiveFilters(this.appliedFilters());
  }

  /**
   * Handle pagination change
   */
  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.loadData();
  }

  /**
   * Handle sort change on LocationType column
   */
  onSortChange(column: string): void {
    if (column !== 'locationType') return;

    // Toggle between DESC and ASC (never null)
    this.sortDirection = this.sortDirection === 'DESC' ? 'ASC' : 'DESC';
    this.sortField = column;
    this.liveAnnouncer.announce(
      `Sorted by location type ${this.sortDirection === 'ASC' ? 'ascending' : 'descending'}`,
      'polite'
    );
    this.loadData();
  }

  /**
   * Get sort icon for LocationType column
   */
  getSortIcon(column: string): string {
    if (column !== 'locationType') return '';

    return this.sortDirection === 'ASC' ? 'arrow_upward' : 'arrow_downward';
  }

  getSortDirection(column: string): string {
    if (column !== this.sortField) return 'unsorted';
    return this.sortDirection === 'ASC' ? 'ascending' : 'descending';
  }

  /**
   * Toggle individual row expansion
   */
  toggleRow(index: number): void {
    if (this.expandedRows.has(index)) {
      this.expandedRows.delete(index);
    } else {
      this.expandedRows.add(index);
    }
  }

  /**
   * Check if row is expanded
   */
  isRowExpanded(index: number): boolean {
    return this.expandedRows.has(index);
  }

  /**
   * Toggle all rows expansion
   */
  toggleAllRows(): void {
    if (this.allRowsExpanded) {
      this.expandedRows.clear();
      this.allRowsExpanded = false;
    } else {
      this.dataSource().forEach((_, index) => {
        this.expandedRows.add(index);
      });
      this.allRowsExpanded = true;
    }
  }

  /**
   * Format date to DD-MMM-YYYY
   */
  formatDate(date: string | undefined): string {
    if (!date) return '-';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '-';
      const day = String(d.getDate()).padStart(2, '0');
      const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return '-';
    }
  }

  /**
   * Format datetime to DD-MMM-YYYY HH:MM
   */
  formatDateTime(datetime: string | undefined): string {
    if (!datetime) return '-';
    try {
      const d = new Date(datetime);
      const day = String(d.getDate()).padStart(2, '0');
      const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}-${month}-${year} ${hours}:${minutes}`;
    } catch {
      return '-';
    }
  }

  /**
   * Format time from ISO string using chapter timezone (Gap #6).
   * Oracle stores OPEN_TIME/CLOSE_TIME as UTC; display in chapter local time.
   */
  formatTime(time: string | undefined): string {
    if (!time) return '-';
    try {
      // Append Z if absent: .NET/Dapper serializes Oracle DATE with no Z suffix,
      // which JS would parse as browser-local time instead of UTC.
      const normalized = time.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(time) ? time : time + 'Z';
      const d = new Date(normalized);
      if (isNaN(d.getTime())) return '-';
      const offsetMinutes = this.chapterTimezoneService.getChapterUtcOffsetMinutes();
      if (offsetMinutes !== null) {
        const utcMins = d.getUTCHours() * 60 + d.getUTCMinutes();
        const localMins = ((utcMins + offsetMinutes) % 1440 + 1440) % 1440;
        return `${String(Math.floor(localMins / 60)).padStart(2, '0')}:${String(localMins % 60).padStart(2, '0')}`;
      }
      const hours = String(d.getUTCHours()).padStart(2, '0');
      const minutes = String(d.getUTCMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '-';
    }
  }

  /**
   * Show tooltip only if text is overflowing (ellipsis is active)
   */
  showTooltipIfOverflowing(element: HTMLElement, tooltip: MatTooltip): void {
    tooltip.disabled = element.scrollWidth <= element.clientWidth;
  }

  /**
   * Format rotation flag to Yes/No
   */
  formatRotationFlag(flag: string | undefined): string {
    if (!flag) return '-';
    return flag.toUpperCase() === 'Y' ? 'Yes' : 'No';
  }

  /**
   * Check if a row is currently being edited
   */
  isRowBeingEdited(row: DriveLocation): boolean {
    return this.sidePanelMode === 'edit' && this.sidePanelData?.locationId === row.locationId;
  }

  /**
   * Handle edit action - Opens side panel in edit mode
   */
  onEdit(row: DriveLocation, event: Event): void {
    event.stopPropagation();
    this.openEditPanel(row);
  }

  /**
   * Open side panel in add mode
   */
  openAddPanel(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelView = 'form';
    this.appliedInternationalAddressData = null;
    this.isSidePanelOpen.set(true);
  }

  /**
   * Open side panel in edit mode
   */
  openEditPanel(location: DriveLocation): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = location;
    this.sidePanelView = 'form';
    this.appliedInternationalAddressData = null;
    this.isSidePanelOpen.set(true);
  }

  /**
   * Close side panel
   */
  closeSidePanel(): void {
    this.isSidePanelOpen.set(false);
    this.sidePanelData = null;
    this.sidePanelView = 'form';
    this.internationalAddressRecordKey = null;
    this.appliedInternationalAddressData = null;
  }

  /**
   * Open International Address screen within side panel
   */
  openInternationalAddress(event: { recordKey: string; hasUSAddressData: boolean; existingData?: any }): void {
    this.internationalAddressRecordKey = event.recordKey;
    this.hasUSAddressData = event.hasUSAddressData;
    // If existing data is passed from edit mode, use it
    if (event.existingData) {
      this.appliedInternationalAddressData = event.existingData;
    }
    this.sidePanelView = 'international-address';
  }

  /**
   * Close International Address and return to form
   */
  closeInternationalAddress(): void {
    this.sidePanelView = 'form';
    this.internationalAddressRecordKey = null;
  }

  /**
   * Handle international address apply - store data and return to form
   */
  onInternationalAddressApply(data: any): void {
    this.appliedInternationalAddressData = data;
    this.sidePanelView = 'form';
    this.internationalAddressRecordKey = null;
  }

  /**
   * Handle save success - reload data and close panel
   */
  onSaveSuccess(): void {
    this.loadData();
    this.closeSidePanel();
  }

  /**
   * Handle view direction action
   */
  onViewDirection(row: DriveLocation): void {
    const chapterId = this.headerService.getCurrentChapterId();

    this.maintainDriveLocationService.getDriveLocationDetails(row.locationId, chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details: any) => {
          this.dialog.open(ViewDirectionComponent, {
            width: '600px',
            maxWidth: '90vw',
            data: {
              locationId: row.locationId,
              locationName: details.locationName || row.locationName,
              directions: details.siteDirections || ''
            },
            disableClose: false,
            autoFocus: 'dialog'
          });
        },
        error: (error: any) => {
          console.error('Error loading drive location details:', error);
          this.snackbarService.showError('Error loading direction details');
        }
      });
  }

  /**
   * Handle view contact address action
   */
  onViewContactAddress(row: DriveLocation): void {
    const chapterId = this.headerService.getCurrentChapterId();

    this.maintainDriveLocationService.getDriveLocationDetails(row.locationId, chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details: any) => {
          const address = details.address || {};

          // Format notes from the notes array
          const notesText = details.notes && Array.isArray(details.notes) && details.notes.length > 0
            ? details.notes.map((note: any) => note.note).join('\n\n')
            : '';

          this.viewContactAddressData = {
            locationId: row.locationId,
            address: {
              locationName: address.address1 || '',
              street: address.streetName || '',
              suitApt: address.suiteApt || '',
              city: address.city || '',
              state: address.state || '',
              zipCode: address.zip || '',
              mapsco: address.mapsco || '',
              county: address.county || '',
              phone: address.dAreaCode && address.dPhoneNo ? `${address.dAreaCode}-${address.dPhoneNo}${address.extension ? ' ext ' + address.extension : ''}` : '',
              fax: address.fAreaCode && address.fPhoneNo ? `${address.fAreaCode}-${address.fPhoneNo}` : '',
              email: address.email || '',
              web: address.webAddress || '',
              notes: notesText
            }
          };
          this.sidePanelView = 'view-contact-address';
          this.isSidePanelOpen.set(true);
        },
        error: (error: any) => {
          console.error('Error loading drive location details:', error);
          this.snackbarService.showError('Error loading contact address details');
        }
      });
  }

  /**
   * Handle view international address action
   */
  onViewInternationalAddress(row: DriveLocation): void {
    const chapterId = this.headerService.getCurrentChapterId();

    this.maintainDriveLocationService.getDriveLocationDetails(row.locationId, chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details: any) => {
          const address = details.address || {};

          // Always show the view panel, even if no international address data exists
          this.viewInternationalAddressData = {
            locationId: row.locationId,
            address: {
              address1: address.intlAddress1 || '',
              address2: address.intlAddress2 || '',
              address3: address.intlAddress3 || '',
              address4: address.intlAddress4 || '',
              country: address.countryName || '',
              postalCode: address.intlPostalCode || '',
              workPhoneNumber: address.intlWorkPhoneNo || '',
              extension: address.intlWorkPhoneExt || '',
              homePhoneNumber: address.intlHomePhoneNo || '',
              mobilePhoneNumber: address.intlMobilePhoneNo || '',
              fax: address.intlFaxNo || '',
              email: address.intlEmail || ''
            }
          };
          this.sidePanelView = 'view-international-address';
          this.isSidePanelOpen.set(true);
        },
        error: (error: any) => {
          console.error('Error loading drive location details:', error);
          this.snackbarService.showError('Error loading international address details');
        }
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reload data when chapter changes
      });
  }
}
