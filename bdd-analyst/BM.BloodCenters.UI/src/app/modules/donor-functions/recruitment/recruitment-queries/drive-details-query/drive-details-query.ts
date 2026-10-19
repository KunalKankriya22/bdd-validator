import { Component, OnInit, OnDestroy, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { Subject, takeUntil, debounceTime, finalize } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { QuickLinks } from '@shared/components/quick-links/quick-links';
import { QuickLink } from '@shared/interfaces/dialog.interface';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { UppercaseMomentDateAdapter, DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

import { LocationNotesPanel } from './panels/location-notes-panel/location-notes-panel';
import { DriveChecklistPanel } from './panels/drive-checklist-panel/drive-checklist-panel';
import { DriveResourcesPanel } from './panels/drive-resources-panel/drive-resources-panel';
import { PickupSchedulePanel } from './panels/pickup-schedule-panel/pickup-schedule-panel';
import { DriveSuppliesPanel } from './panels/drive-supplies-panel/drive-supplies-panel';
import { DriveProceduresPanel } from './panels/drive-procedures-panel/drive-procedures-panel';

import { DriveDetailsQueryService } from './services/drive-details-query.service';
import {
  DriveSelectionOption,
  DriveFilterSponsor,
  DriveLookup,
  DriveDetailsModel,
  DriveNote
} from './models/drive-details-query.model';

@Component({
  selector: 'app-drive-details-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    MatMomentDateModule,
    PageHeaderWithBreadcrumb,
    QuickLinks,
    LocationNotesPanel,
    DriveChecklistPanel,
    DriveResourcesPanel,
    PickupSchedulePanel,
    DriveSuppliesPanel,
    DriveProceduresPanel
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './drive-details-query.html',
  styleUrl: './drive-details-query.scss'
})
export class DriveDetailsQueryComponent implements OnInit, OnDestroy {
  private readonly headerService = inject(HeaderService);
  private readonly menuService = inject(MenuService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly service = inject(DriveDetailsQueryService);
  private destroy$ = new Subject<void>();

  // Fallback values from Figma
  private readonly DEFAULT_TITLE = 'Drive Details Query';
  private readonly DEFAULT_SUBTITLE = 'View and perform actions on Drive Details Query';

  // Page Header
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/' },
      { label: 'Drive Details Query', link: null }
    ],
    title: this.DEFAULT_TITLE,
    subtitle: this.DEFAULT_SUBTITLE,
    actions: []
  };

  // Filter Form
  filterForm = new FormGroup({
    selectFilter: new FormControl<string>(''),
    sponsorId: new FormControl<string>(''),
    driveDate: new FormControl<Date | null>(null),
    driveId: new FormControl<string>('')
  });

  // Search controls for dropdowns
  sponsorSearchControl = new FormControl('');
  driveSearchControl = new FormControl('');

  // Data from API
  selectFilterOptions: DriveSelectionOption[] = [];
  sponsors: DriveFilterSponsor[] = [];
  filteredSponsors: DriveFilterSponsor[] = [];
  drives: DriveLookup[] = [];
  filteredDrives: DriveLookup[] = [];

  // Selected sponsor info (read-only display)
  selectedSponsorName: string = '';
  selectedDriveCreatedDate: string = '';

  // Tooltip state for truncated text
  isSponsorNameTruncated = false;
  truncatedFields: Map<string, boolean> = new Map();

  // State
  hasSearched = false;
  isLoading = false;
  isLoadingFilters = false;

  // Side Panel States
  locationNotesPanelOpen = false;
  driveChecklistPanelOpen = false;
  driveResourcesPanelOpen = false;
  pickupSchedulePanelOpen = false;
  driveSuppliesPanelOpen = false;
  driveProceduresPanelOpen = false;

  // Quick Links configuration
  quickLinksTitle = 'QUICK LINKS';
  quickLinks: QuickLink[] = [
    { id: 'checklist', label: 'DRIVE CHECKLIST' },
    { id: 'resources', label: 'DRIVE RESOURCES' },
    { id: 'pickups', label: 'DRIVE PICKUPS' },
    { id: 'supplies', label: 'DRIVE SUPPLIES' },
    { id: 'procedures', label: 'DRIVE PROCEDURES' },
    { id: 'abo', label: 'DRIVE ABO', disabled: true, tooltip: 'Coming soon' },
    { id: 'stat', label: 'DRIVE STAT', disabled: true, tooltip: 'Coming soon' },
    { id: 'sheet', label: 'DRIVE SHEET', disabled: true, tooltip: 'Coming soon' }
  ];

  // Drive Details Data (populated after retrieve)
  driveDetails: DriveDetailsModel | null = null;

  // Notes
  notes: DriveNote[] = [];

  constructor() {
    // Reload on chapter change
    effect(() => {
      const chapterId = this.headerService.chapterId();
      if (chapterId) {
        this.loadFilters();
      }
    });
  }

  ngOnInit(): void {
    this.loadPageHeaderFromMenu();
    this.setupSponsorSearch();
    this.setupDriveSearch();
    this.checkQueryParams();
  }

  private loadPageHeaderFromMenu(): void {
    const currentPath = this.router.url.split('?')[0];
    const menuItem = this.menuService.findMenuItemByPath(currentPath);

    const title = menuItem?.label || this.DEFAULT_TITLE;
    const subtitle = menuItem?.remarks || this.DEFAULT_SUBTITLE;

    this.headerConfig = {
      ...this.headerConfig,
      title,
      subtitle,
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: title, link: null }
      ]
    };
  }

  /**
   * Check if driveId is passed via query params and auto-populate/search
   */
  private checkQueryParams(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const driveId = params['driveId'];
      const driveType = params['driveType'];

      if (driveId) {
        // Check if navigation from draw query dialog (show loader immediately)
        const isNavigating = sessionStorage.getItem('driveDetailsNavigating');
        if (isNavigating === 'true') {
          this.isLoading = true;
          this.hasSearched = true;
          sessionStorage.removeItem('driveDetailsNavigating');
        }

        // Set "All Drives" as the select filter
        this.filterForm.patchValue({
          selectFilter: driveType || 'BOTH',
          driveId: driveId
        });

        // Wait for filters to load, then trigger retrieve
        if (this.selectFilterOptions.length > 0) {
          this.onRetrieve();
        } else {
          // If filters haven't loaded yet, wait for them
          const subscription = this.service.getFilters()
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
              this.onRetrieve();
              subscription.unsubscribe();
            });
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load filter dropdown data from API
   */
  private loadFilters(): void {
    this.isLoadingFilters = true;

    this.service.getFilters()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingFilters = false)
      )
      .subscribe({
        next: (filters) => {
          this.selectFilterOptions = filters.selectOptions || [];
          this.sponsors = filters.sponsors || [];
          this.filteredSponsors = [...this.sponsors];
          this.drives = filters.drives || [];
          this.filteredDrives = [...this.drives];
        },
        error: (err) => {
          console.error('Error loading filters:', err);
        }
      });
  }

  private setupSponsorSearch(): void {
    this.sponsorSearchControl.valueChanges.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(search => {
      this.filteredSponsors = this.sponsors.filter(s =>
        (s.name?.toLowerCase() || '').includes((search || '').toLowerCase()) ||
        (s.sponsorId?.toLowerCase() || '').includes((search || '').toLowerCase())
      );
    });
  }

  private setupDriveSearch(): void {
    this.driveSearchControl.valueChanges.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(search => {
      this.filteredDrives = this.drives.filter(d =>
        (d.driveId?.toLowerCase() || '').includes((search || '').toLowerCase())
      );
    });
  }

  onSponsorChange(sponsorId: string): void {
    const sponsor = this.sponsors.find(s => s.sponsorId === sponsorId);
    this.selectedSponsorName = sponsor?.name || '';
  }

  onDriveChange(driveId: string): void {
    const drive = this.drives.find(d => d.driveId === driveId);
    if (drive?.driveDate) {
      this.selectedDriveCreatedDate = this.formatDateString(drive.driveDate);
    } else {
      this.selectedDriveCreatedDate = '';
    }
  }

  onRetrieve(): void {
    const driveId = this.filterForm.value.driveId;
    if (!driveId) {
      return;
    }

    // Mark date field as touched to show validation errors
    this.filterForm.get('driveDate')?.markAsTouched();

    // Check for date validation errors before proceeding
    if (this.filterForm.invalid) {
      return;
    }

    this.hasSearched = true;
    this.isLoading = true;

    const formValue = this.filterForm.value;

    this.service.getDriveDetails({
      select: formValue.selectFilter || undefined,
      sponsorId: formValue.sponsorId || undefined,
      driveDate: formValue.driveDate ? DateFieldValidationUtility.serializeDateForApi(formValue.driveDate) || undefined : undefined,
      driveId: formValue.driveId || undefined
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          this.driveDetails = response.driveDetails;
          this.notes = response.notes || [];

          // Update selected sponsor name from drive details if available
          if (this.driveDetails?.sponsorName) {
            this.selectedSponsorName = this.driveDetails.sponsorName;
          }
        },
        error: (err) => {
          console.error('Error fetching drive details:', err);
          this.driveDetails = null;
          this.notes = [];
        }
      });
  }

  onQuickLinkClick(link: QuickLink): void {
    if (link.disabled) {
      return;
    }

    switch (link.id) {
      case 'checklist':
        this.openDriveChecklistPanel();
        break;
      case 'resources':
        this.openDriveResourcesPanel();
        break;
      case 'pickups':
        this.openPickupSchedulePanel();
        break;
      case 'supplies':
        this.openDriveSuppliesPanel();
        break;
      case 'procedures':
        this.openDriveProceduresPanel();
        break;
    }
  }

  openLocationNotesPanel(): void {
    const driveId = this.filterForm.value.driveId;
    if (!driveId) return;

    this.locationNotesPanelOpen = true;
  }

  closeLocationNotesPanel(): void {
    this.locationNotesPanelOpen = false;
  }

  // Drive Checklist Panel
  openDriveChecklistPanel(): void {
    this.driveChecklistPanelOpen = true;
  }

  closeDriveChecklistPanel(): void {
    this.driveChecklistPanelOpen = false;
  }

  // Drive Resources Panel
  openDriveResourcesPanel(): void {
    this.driveResourcesPanelOpen = true;
  }

  closeDriveResourcesPanel(): void {
    this.driveResourcesPanelOpen = false;
  }

  // Pickup Schedule Panel
  openPickupSchedulePanel(): void {
    this.pickupSchedulePanelOpen = true;
  }

  closePickupSchedulePanel(): void {
    this.pickupSchedulePanelOpen = false;
  }

  // Drive Supplies Panel
  openDriveSuppliesPanel(): void {
    this.driveSuppliesPanelOpen = true;
  }

  closeDriveSuppliesPanel(): void {
    this.driveSuppliesPanelOpen = false;
  }

  // Drive Procedures Panel
  openDriveProceduresPanel(): void {
    this.driveProceduresPanelOpen = true;
  }

  closeDriveProceduresPanel(): void {
    this.driveProceduresPanelOpen = false;
  }

  /**
   * Format date string from API to DD-MMM-YYYY format
   */
  private formatDateString(dateStr: string | null): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateStr;
    }
  }

  /**
   * Format note date for display
   */
  formatNoteDate(dateStr: string | null): string {
    return this.formatDateString(dateStr);
  }

  /**
   * Format version number to always show one decimal place
   */
  formatVersion(value: number | null): string {
    if (value === null || value === undefined) {
      return '--';
    }
    return value.toFixed(1);
  }

  /**
   * Format user name: converts "Last, First" to "First Last"
   */
  formatUserName(userName: string | null, userId: string | null): string {
    if (!userName && !userId) {
      return '--';
    }

    const name = userName || userId || '--';

    // Check if name contains comma (Last, First format)
    if (name.includes(',')) {
      const parts = name.split(',').map(part => part.trim());
      if (parts.length === 2) {
        return `${parts[1]} ${parts[0]}`; // First Last
      }
    }

    return name;
  }

  /**
   * Format CPU value with dollar sign
   */
  formatCpu(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '--';
    }
    return `$${value.toFixed(2)}`;
  }

  getFieldValue(value: string | number | null | undefined, placeholder: string = '--'): string {
    if (value === null || value === undefined || value === '') {
      return placeholder;
    }
    return String(value);
  }

  /**
   * Validates date input on blur.
   * Sets invalidDateFormat error if input has text but control value is null (parse failed).
   */
  onDateBlur(controlName: string, inputElement: HTMLInputElement): void {
    const control = this.filterForm.get(controlName);
    const inputValue = inputElement.value?.trim();

    if (inputValue && control?.value === null) {
      control.setErrors({ invalidDateFormat: true });
      control.markAsTouched();
    }
  }

  /**
   * Get error message for Drive Date field.
   */
  getDriveDateError(): string {
    const control = this.filterForm.get('driveDate');

    if (control?.hasError('invalidDateFormat') ||
        control?.hasError('invalidDate') ||
        control?.hasError('matDatepickerParse')) {
      return 'Drive Date is invalid';
    }

    return '';
  }

  /**
   * Check if sponsor name text is truncated and update tooltip state.
   * Called on mouseenter of the sponsor name input.
   */
  checkSponsorNameTruncation(inputElement: HTMLInputElement): void {
    this.isSponsorNameTruncated = inputElement.scrollWidth > inputElement.clientWidth;
  }

  /**
   * Check if text is truncated for a given field.
   * Called on mouseenter of detail value elements.
   */
  checkTruncation(fieldId: string, element: HTMLElement): void {
    this.truncatedFields.set(fieldId, element.scrollWidth > element.clientWidth);
  }

  /**
   * Check if a field is truncated.
   */
  isFieldTruncated(fieldId: string): boolean {
    return this.truncatedFields.get(fieldId) || false;
  }
}
