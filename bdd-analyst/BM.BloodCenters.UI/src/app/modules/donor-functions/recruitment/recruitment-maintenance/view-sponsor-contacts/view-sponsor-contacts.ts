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

import { MaintainSponsorContactsService } from '../../recruitment-administration/maintain-sponsor-contacts/services/maintain-sponsor-contacts.service';
import {
  SponsorContactModel,
  SponsorContactDetailModel,
  SponsorContactParamsDto,
  SponsorLookupItem,
  ContactNameLookupItem
} from '../../recruitment-administration/maintain-sponsor-contacts/models/maintain-sponsor-contacts.model';
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

import { ViewContactDetailsComponent } from './view-contact-details/view-contact-details';
import { ViewContactAddressComponent } from './view-contact-address/view-contact-address';
import { ViewInternationalAddressComponent } from './view-international-address/view-international-address';
import { ViewContactNotesComponent } from './view-contact-notes/view-contact-notes';

@Component({
  selector: 'app-view-sponsor-contacts',
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
    ViewContactDetailsComponent,
    ViewContactAddressComponent,
    ViewInternationalAddressComponent,
    ViewContactNotesComponent
  ],
  templateUrl: './view-sponsor-contacts.html',
  styleUrls: ['./view-sponsor-contacts.scss']
})
export class ViewSponsorContactsComponent implements OnInit, OnDestroy {
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('contextMenuTrigger', { read: MatMenuTrigger }) contextMenuTrigger!: MatMenuTrigger;

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

  // Searchable contact name dropdown
  readonly contactNameSearchControl = new FormControl('');
  readonly contactNameSearch = signal('');
  readonly contactNameOptionsSignal = signal<ContactNameLookupItem[]>([]);
  readonly filteredContactNameOptions = computed(() => {
    const search = this.contactNameSearch().toLowerCase();
    const options = this.contactNameOptionsSignal();
    if (!search) return options;
    return options.filter(c => {
      const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim().toLowerCase();
      return fullName.includes(search) ||
        c.lastName.toLowerCase().includes(search) ||
        (c.firstName || '').toLowerCase().includes(search);
    });
  });

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
  sidePanelType: 'view' | 'address' | 'intlAddress' | 'notes' = 'view';
  sidePanelData: SponsorContactModel | null = null;
  sidePanelDetailData: SponsorContactDetailModel | null = null;
  sidePanelLoading = false;

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

    this.contactNameSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.contactNameSearch.set(value || '');
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
        this.loadContactNames();
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
        column: 'contactTypeDescription',
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
        width: '120px',
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'salutationDescription',
        header: 'Honorific',
        width: '100px',
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'firstName',
        header: 'First Name',
        width: '150px',
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'lastName',
        header: 'Last Name',
        width: '150px',
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'titleDescription',
        header: 'Title',
        width: '200px',
        valueFormatter: (value) => value || '-'
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
        icon: 'visibility',
        label: 'View contact',
        ariaLabel: 'View contact details',
        color: 'default',
        action: 'view'
      },
      {
        icon: 'more_vert',
        label: 'More actions',
        ariaLabel: 'More actions for contact',
        color: 'default',
        action: 'menu'
      }
    ];
  }

  // Track the row for the context menu
  menuRow: SponsorContactModel | null = null;

  onMenuAction(action: string): void {
    if (!this.menuRow) return;
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

  private loadContactNames(): void {
    const chapterId = this.headerService.getCurrentChapterId();
    this.sponsorContactsService.getContactNames(chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.contactNameOptionsSignal.set(data);
        },
        error: () => {
          this.contactNameOptionsSignal.set([]);
        }
      });
  }

  onRetrieve(): void {
    if (this.searchForm.invalid) {
      return;
    }

    const formValue = this.searchForm.value;

    this.requestState = {
      chapterId: this.headerService.getCurrentChapterId(),
      sponsorId: formValue.sponsorId || undefined,
      contactName: formValue.contactName?.trim() || undefined,
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
          this.dataSource = response.data;
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

  onPageChange(event: TablePageEvent): void {
    if (!this.hasRetrieved) {
      return;
    }

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    if (!this.hasRetrieved) {
      return;
    }

    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    this.requestState.sort =
      event.direction === 'default' ? undefined : event.direction;

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<SponsorContactModel>): void {
    switch (event.action) {
      case 'view':
        this.openViewContact(event.row);
        break;
      case 'menu':
        this.menuRow = event.row;
        if (this.contextMenuTrigger) {
          this.contextMenuTrigger.openMenu();
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

  openViewContact(contact: SponsorContactModel): void {
    this.sidePanelType = 'view';
    this.loadContactDetailAndOpenPanel(contact);
  }

  openContactAddress(contact: SponsorContactModel): void {
    this.sidePanelType = 'address';
    this.loadContactDetailAndOpenPanel(contact);
  }

  openInternationalAddress(contact: SponsorContactModel): void {
    this.sidePanelType = 'intlAddress';
    this.loadContactDetailAndOpenPanel(contact);
  }

  openContactNotes(contact: SponsorContactModel): void {
    this.sidePanelType = 'notes';
    this.loadContactDetailAndOpenPanel(contact);
  }

  private loadContactDetailAndOpenPanel(contact: SponsorContactModel): void {
    this.sidePanelData = contact;
    this.sidePanelDetailData = null;
    this.sidePanelOpen = true;

    if (!contact.sponsorId || !contact.addressId) {
      // No detail to fetch, use basic data
      return;
    }

    this.sidePanelLoading = true;
    this.sponsorContactsService.getContactDetail(contact.sponsorId, contact.addressId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          this.sidePanelDetailData = detail;
          this.sidePanelLoading = false;
        },
        error: () => {
          this.sidePanelDetailData = null;
          this.sidePanelLoading = false;
        }
      });
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    this.sidePanelDetailData = null;
    this.sidePanelLoading = false;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }

  private formatDateDisplay(dateValue: string | Date): string {
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    // Parse as UTC to avoid timezone offset issues
    const date = typeof dateValue === 'string'
      ? new Date(dateValue + 'T00:00:00Z')
      : dateValue;

    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = monthNames[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${day}-${month}-${year}`;
  }
}
