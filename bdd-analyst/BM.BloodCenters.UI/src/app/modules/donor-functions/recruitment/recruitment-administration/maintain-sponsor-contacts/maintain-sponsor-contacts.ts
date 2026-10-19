import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { MaintainSponsorContactsService } from './services/maintain-sponsor-contacts.service';
import {
  SponsorContactModel,
  SponsorContactParamsDto,
  SponsorLookupItem
} from './models/maintain-sponsor-contacts.model';
import { HeaderService } from '@shared/services/header.service';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';

import { EditContactDetailsComponent } from './edit-contact-details/edit-contact-details';
import { AddNewContactComponent } from './add-new-contact/add-new-contact';
import { ContactAddressComponent } from './contact-address/contact-address';
import { InternationalAddressComponent } from './international-address/international-address';
import { ContactNotesComponent } from './contact-notes/contact-notes';

@Component({
  selector: 'app-maintain-sponsor-contacts',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatMenuModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    EditContactDetailsComponent,
    AddNewContactComponent,
    ContactAddressComponent,
    InternationalAddressComponent,
    ContactNotesComponent
  ],
  templateUrl: './maintain-sponsor-contacts.html',
  styleUrls: ['./maintain-sponsor-contacts.scss']
})
export class MaintainSponsorContactsComponent implements OnInit, OnDestroy {
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('contextMenuTrigger', { read: MatMenuTrigger }) contextMenuTrigger!: MatMenuTrigger;
  @ViewChild('menuTriggerElement', { read: ElementRef }) menuTriggerElement!: ElementRef<HTMLElement>;

  // Track the row for the context menu
  menuRow: SponsorContactModel | null = null;
  menuHighlightedRow: SponsorContactModel | null = null;
  private menuActionTriggered = false;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  tableConfig!: DataTableConfig<SponsorContactModel>;

  // Search form
  searchForm!: FormGroup;

  // Searchable sponsor dropdown
  readonly sponsorSearchControl = new FormControl('');
  readonly sponsorSearch = signal('');
  readonly sponsorOptionsSignal = signal<SponsorLookupItem[]>([]);
  readonly filteredSponsorOptions = computed(() => {
    const search = this.sponsorSearch().toLowerCase();
    const options = this.sponsorOptionsSignal();
    if (!search) return options;
    return options.filter(s =>
      s.sponsorId.toLowerCase().includes(search) ||
      s.name.toLowerCase().includes(search)
    );
  });

  // Contact name is now a free-text input field (no longer a dropdown)

  matchTypeOptions = [
    { label: 'Exact', value: 'Exact' },
    { label: 'Like', value: 'Like' },
    { label: 'Soundex', value: 'Soundex' }
  ];
  showTerminatedOptions = [
    { label: 'Yes', value: true },
    { label: 'No', value: false }
  ];

  dataSource: SponsorContactModel[] = [];
  requestState: SponsorContactParamsDto = {};

  isLoading = false;
  hasRetrieved = false;

  // Side Panel State
  sidePanelOpen = false;
  sidePanelType: 'add' | 'edit' | 'address' | 'intlAddress' | 'notes' = 'add';
  sidePanelData: SponsorContactModel | null = null;

  get activeHighlightedRow(): SponsorContactModel | null {
    return this.sidePanelData || this.menuHighlightedRow;
  }

  private destroy$ = new Subject<void>();
  currentYear: number = new Date().getFullYear();

  constructor(
    private sponsorContactsService: MaintainSponsorContactsService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private headerService: HeaderService,
    private pageHeaderService: PageHeaderService
  ) {
    this.initializeConfigurations();
    this.initializeSearchForm();

    this.sponsorSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.sponsorSearch.set(value || '');
      });

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });

    effect(() => {
      const chapterId = this.headerService.chapterId();
      if (chapterId) {
        this.loadSponsorLookup();
      }
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeConfigurations(): void {

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: 25,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      sortConfig: {
        column: 'lastName',
        direction: 'A'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No sponsor contacts found matching the current criteria',
      loadingMessage: 'Loading sponsor contacts...',
      showPagination: true
    };
  }

  private initializeSearchForm(): void {
    this.searchForm = this.fb.group({
      sponsorId: ['', [Validators.required]],
      contactName: [''],
      matchType: [''],
      showTerminated: ['']
    });
  }

  private getTableColumns(): TableColumn<SponsorContactModel>[] {
    return [
      {
        key: 'contactTypeDescription',
        header: 'Type',
        sortable: true,
        width: '120px'
      },
      {
        key: 'salutationDescription',
        header: 'Honorific',
        width: '100px'
      },
      {
        key: 'firstName',
        header: 'First Name',
        width: '150px'
      },
      {
        key: 'lastName',
        header: 'Last Name',
        sortable: true,
        width: '150px'
      },
      {
        key: 'titleDescription',
        header: 'Title',
        width: '200px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '140px',
        valueFormatter: (value) => value ? this.formatDateDisplay(new Date(value)) : '-'
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '140px',
        valueFormatter: (value) => value ? this.formatDateDisplay(new Date(value)) : '-'
      }
    ];
  }

  private getRowActions(): RowAction<SponsorContactModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit contact',
        ariaLabel: 'Edit contact {{lastName}}',
        color: 'default',
        action: 'edit'
      },
      {
        icon: 'more_vert',
        label: 'More actions',
        ariaLabel: 'More actions for {{lastName}}',
        color: 'default',
        action: 'menu'
      }
    ];
  }

  onMenuAction(action: string): void {
    if (!this.menuRow) return;
    this.menuActionTriggered = true;
    switch (action) {
      case 'address':
        this.openContactAddress(this.menuRow);
        break;
      case 'intlAddress':
        this.openInternationalAddress(this.menuRow);
        break;
      case 'notes':
        this.openContactNotes(this.menuRow);
        break;
    }
    this.menuRow = null;
  }

  onContextMenuClosed(): void {
    if (!this.menuActionTriggered) {
      this.menuHighlightedRow = null;
    }
    this.menuActionTriggered = false;
  }

  private loadSponsorLookup(): void {
    const chapterId = this.headerService.getCurrentChapterId();
    this.sponsorContactsService.getSponsorIds(chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.sponsorOptionsSignal.set(data);
        },
        error: () => {
          this.sponsorOptionsSignal.set([]);
        }
      });
  }


  onRetrieve(): void {
    // Mark sponsor ID field as touched to show validation errors
    this.searchForm.get('sponsorId')?.markAsTouched();

    // Validate form
    if (this.searchForm.get('sponsorId')?.invalid) {
      return;
    }

    const formValue = this.searchForm.value;

    this.requestState = {
      chapterId: this.headerService.getCurrentChapterId(),
      sponsorId: formValue.sponsorId || undefined,
      contactName: formValue.contactName?.trimStart()?.trim() || undefined,
      matchType: formValue.matchType || undefined,
      showTerminated: formValue.showTerminated !== '' ? formValue.showTerminated : undefined
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.hasRetrieved = true;
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);
    const take = this.tableConfig.pagination?.pageSize || 25;

    this.sponsorContactsService
      .getSponsorContacts(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Trim leading spaces from all text fields in the response data
          this.dataSource = this.trimContactData(response.data);
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.dataSource = [];
          this.tableConfig.pagination!.totalRecords = 0;
        }
      });
  }

  /**
   * Trims leading spaces from all text fields in contact data.
   * This ensures that contact names and other fields display correctly without leading spaces.
   */
  private trimContactData(data: SponsorContactModel[]): SponsorContactModel[] {
    return data.map(contact => ({
      ...contact,
      firstName: contact.firstName?.trimStart() || contact.firstName,
      lastName: contact.lastName?.trimStart() || contact.lastName,
      salutationDescription: contact.salutationDescription?.trimStart() || contact.salutationDescription,
      contactTypeDescription: contact.contactTypeDescription?.trimStart() || contact.contactTypeDescription,
      titleDescription: contact.titleDescription?.trimStart() || contact.titleDescription
    }));
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    this.requestState.sort =
      event.direction === 'default' ? undefined : event.direction;

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<SponsorContactModel>): void {
    switch (event.action) {
      case 'edit':
        this.openEditContact(event.row);
        break;
      case 'menu':
        this.menuRow = event.row;
        this.menuHighlightedRow = event.row;
        this.menuActionTriggered = false;
        if (this.contextMenuTrigger && this.menuTriggerElement) {
          setTimeout(() => {
            const activeButton = document.activeElement as HTMLElement;
            const moreVertButton = activeButton?.closest('.data-table__action-button') as HTMLElement;

            if (moreVertButton) {
              const buttonRect = moreVertButton.getBoundingClientRect();
              const triggerEl = this.menuTriggerElement.nativeElement;
              triggerEl.style.position = 'fixed';
              triggerEl.style.left = `${buttonRect.left}px`;
              triggerEl.style.top = `${buttonRect.top}px`;
            }

            this.contextMenuTrigger.openMenu();
          }, 0);
        }
        break;
      case 'address':
        this.openContactAddress(event.row);
        break;
      case 'intlAddress':
        this.openInternationalAddress(event.row);
        break;
      case 'notes':
        this.openContactNotes(event.row);
        break;
    }
  }

  clearField(fieldName: string, event: Event): void {
    event.stopPropagation();
    this.searchForm.get(fieldName)?.setValue('');
  }

  openAddNewContact(): void {
    // Mark sponsor ID field as touched to show validation errors
    this.searchForm.get('sponsorId')?.markAsTouched();

    // Validate form
    if (this.searchForm.get('sponsorId')?.invalid) {
      return;
    }

    this.sidePanelType = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  openEditContact(contact: SponsorContactModel): void {
    this.sidePanelType = 'edit';
    this.sidePanelData = contact;
    this.sidePanelOpen = true;
  }

  openContactAddress(contact: SponsorContactModel): void {
    this.sidePanelType = 'address';
    this.sidePanelData = contact;
    this.sidePanelOpen = true;
  }

  openInternationalAddress(contact: SponsorContactModel): void {
    this.sidePanelType = 'intlAddress';
    this.sidePanelData = contact;
    this.sidePanelOpen = true;
  }

  openContactNotes(contact: SponsorContactModel): void {
    this.sidePanelType = 'notes';
    this.sidePanelData = contact;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    this.menuHighlightedRow = null;
  }

  onSaveSuccess(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    this.menuHighlightedRow = null;
    if (this.hasRetrieved) {
      this.loadData();
    }
  }

  onAddAndContinue(): void {
    if (this.hasRetrieved) {
      this.loadData();
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.openAddNewContact();
    }

    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }

  private formatDateDisplay(date: Date): string {
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Formats sponsor display text with ID and optionally truncated name.
   * Long names are truncated with ellipsis (e.g., "12345 - AAAAA...").
   * @param sponsorId - The sponsor ID
   * @param name - The sponsor name
   * @returns Formatted display string
   */
  formatSponsorDisplay(sponsorId: string, name: string | null | undefined): string {
    const trimmedName = name?.trim();
    if (!trimmedName) {
      return sponsorId;
    }

    // Very aggressive truncation for dropdown visibility
    const maxNameLength = 15; // Maximum characters before truncation
    if (trimmedName.length <= maxNameLength) {
      return `${sponsorId} - ${trimmedName}`;
    }

    // Truncate with ellipsis: show first 5 chars only
    const truncated = `${trimmedName.substring(0, 5)}...`;
    return `${sponsorId} - ${truncated}`;
  }

  /**
   * Gets the full sponsor display name for tooltip.
   * @param sponsorId - The sponsor ID
   * @param name - The sponsor name
   * @returns Full display string for tooltip
   */
  getSponsorTooltip(sponsorId: string, name: string | null | undefined): string {
    const trimmedName = name?.trim();
    if (!trimmedName) {
      return sponsorId;
    }
    return `${sponsorId} - ${trimmedName}`;
  }

  /**
   * Prevents leading spaces in input fields.
   * Call this on keydown event for text inputs.
   */
  preventLeadingSpace(event: KeyboardEvent, controlName: string): void {
    const input = event.target as HTMLInputElement;

    // If the input is empty or only contains spaces, prevent space key
    if (event.key === ' ' && (!input.value || input.value.trim() === '')) {
      event.preventDefault();
    }
  }

  /**
   * Removes leading spaces from input value.
   * Call this on input event for text inputs.
   */
  trimLeadingSpace(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // If the input starts with a space, remove all leading spaces
    if (value && value.charAt(0) === ' ') {
      const trimmedValue = value.trimStart();
      input.value = trimmedValue;
      this.searchForm.get(controlName)?.setValue(trimmedValue, { emitEvent: false });
    }
  }

  /**
   * Handles paste events to prevent leading spaces.
   * Call this on paste event for text inputs.
   */
  onPaste(event: ClipboardEvent, controlName: string): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const trimmedText = pastedText.trimStart();

    const input = event.target as HTMLInputElement;
    const control = this.searchForm.get(controlName);

    if (control) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentValue = input.value || '';

      const newValue = currentValue.substring(0, start) + trimmedText + currentValue.substring(end);
      control.setValue(newValue);

      setTimeout(() => {
        const newPosition = start + trimmedText.length;
        input.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  }
}
