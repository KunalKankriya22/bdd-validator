import { TextFieldModule } from '@angular/cdk/text-field';
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  computed,
  HostListener,
  ViewChild,
  ElementRef
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';
import jsPDF from 'jspdf';

import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { LoggingService } from '@shared/services/logging.service';
import { InputValidationUtil } from '@shared/utils/input-validation.util';
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogButton } from '@shared/interfaces/dialog.interface';
import { DonorCommunicationsService } from './services/donor-communications.service';
import {
  DonorCommunication,
  CommunicationType,
  DonorHeader,
  CreateDonorCommunicationDto,
  UpdateDonorCommunicationDto,
  CommunicationLetter,
  LetterCode
} from './models/donor-communications.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DataTableConfig, TableColumn } from '@shared/interfaces/data-table.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';

@Component({
  selector: 'app-donor-communications',
  standalone: true,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    NgxMatSelectSearchModule,
    TextFieldModule,
    SidePanelBase,
    DataTable,
    SearchBar
  ],
  templateUrl: './donor-communications.html',
  styleUrls: ['./donor-communications.scss']
})
export class DonorCommunicationsComponent implements OnInit, OnDestroy {
  // Inputs from parent component (replaces MAT_DIALOG_DATA)
  @Input({ required: true }) donorId!: string;
  @Input() donorName?: string;
  @Input() dob?: string;
  @Input() sex?: string;
  @Input() abo?: string;
  @Input() hideSendLetter = false;

  // Output to parent component (only for close)
  @Output() closePanel = new EventEmitter<void>();

  @ViewChild('targetDateNativeInput') targetDateNativeInput?: ElementRef;
  @ViewChild('actionDateNativeInput') actionDateNativeInput?: ElementRef;

  private readonly service = inject(DonorCommunicationsService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly loggingService = inject(LoggingService);
  private readonly fb = inject(FormBuilder);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly headerService = inject(HeaderService);
  private readonly loginService = inject(LoginService);
  private destroy$ = new Subject<void>();
  private cancelSendLetterLoad$ = new Subject<void>();
  private dateTimeInterval?: number;
  private pendingSendLetterSelection: { comType: string; comCode: string } | null = null;

  // Signals for main table view
  communications = signal<DonorCommunication[]>([]);
  loading = signal(false);
  initialLoading = signal(true);

  // Search bar config for main table filtering
  searchBarConfig: SearchBarConfig = {
    placeholder: 'Search by Communication Type',
    ariaLabel: 'Search by Communication Type',
    minLength: 2,
    debounceTime: 300,
    searchOnEnterOnly: true
  };
  searchText = signal<string>('');

  // Table columns
  displayedColumns: string[] = [
    'comDate',
    'comType',
    'comTypeDesc',
    'comCode',
    'comCodeDesc',
    'targetDate',
    'actionCode',
    'actionDate'
  ];

  // Table data
  dataSource = computed(() => this.communications());

  // Current sort (stored for API calls)
  currentSort = { active: 'comDate', direction: 'desc' as 'asc' | 'desc' | '' };

  // Main communications table configuration
  communicationsTableConfig: DataTableConfig = {
    columns: [
      {
        key: 'comDate',
        header: 'Date',
        sortable: false,
        type: 'text',
        width: '120px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'comType',
        header: 'Type',
        sortable: false,
        type: 'text',
        width: '100px',
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'comTypeDesc',
        header: 'Description',
        sortable: false,
        type: 'text',
        minWidth: '200px',
        truncate: false,
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'comCode',
        header: 'Code',
        sortable: false,
        type: 'text',
        width: '100px',
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'comCodeDesc',
        header: 'Description',
        sortable: false,
        type: 'text',
        minWidth: '200px',
        truncate: false,
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'targetDate',
        header: 'Target Date',
        sortable: false,
        type: 'text',
        width: '120px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'actionCode',
        header: 'Action Code',
        sortable: false,
        type: 'text',
        width: '120px',
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'actionDate',
        header: 'Actual Date',
        sortable: false,
        type: 'text',
        width: '120px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ],
    stickyHeader: true,
    emptyMessage: 'No communications found',
    showTableOnEmpty: false,
    enableRowHighlight: true
  };

  // Footer fields and selected row
  selectedNote = signal<string>('');
  selectedUserName = signal<string>('');
  selectedCommunication = signal<DonorCommunication | null>(null);

  // Donor header info
  donorHeader = signal<DonorHeader | null>(null);

  // ========== Side Panel State ==========
  // Level 2: Form panel (NEW/DETAILS)
  sidePanelOpen = signal(false);
  sidePanelMode = signal<'new' | 'details'>('new');
  sidePanelData = signal<DonorCommunication | null>(null);
  sidePanelLoading = signal(false);
  sidePanelForm!: FormGroup;
  chapterDate!: moment.Moment;

  // Level 3: Letter panels
  viewLettersOpen = signal(false);
  sendLetterOpen = signal(false);

  // View Letters panel state
  letterHistory = signal<CommunicationLetter[]>([]);
  selectedLetter = signal<CommunicationLetter | null>(null);
  letterText = signal<string>('');
  lettersLoading = signal(false);

  // Letter history table configuration
  letterHistoryTableConfig: DataTableConfig = {
    columns: [
      {
        key: 'letterDate',
        header: 'Letter Date',
        sortable: false,
        type: 'text',
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'comments',
        header: 'Comments',
        sortable: false,
        type: 'text',
        valueFormatter: (value) => value || '-'
      }
    ],
    stickyHeader: true,
    emptyMessage: 'No letters found',
    showTableOnEmpty: false,
    enableRowHighlight: true
  };

  // Send Letter panel state
  sendLetterForm!: FormGroup;
  letterCodes = signal<LetterCode[]>([]);
  letterCodeSearchControl = new FormControl('');
  filteredLetterCodes = signal<LetterCode[]>([]);
  selectedLetterCode = signal<LetterCode | null>(null);
  generatedLetterText = signal<string>('');
  sendLetterLoading = signal(false);

  // Side panel dropdown options
  panelCommunicationTypes = signal<{ value: string; label: string }[]>([]);
  panelCommunicationCodes = signal<{ value: string; label: string }[]>([]);
  panelActionCodes = signal<{ value: string; label: string; targetDays?: number }[]>([]);

  // Side panel search controls
  panelComTypeSearchControl = new FormControl('');
  panelFilteredComTypes = signal<{ value: string; label: string }[]>([]);

  panelComCodeSearchControl = new FormControl('');
  panelFilteredComCodes = signal<{ value: string; label: string }[]>([]);

  panelActionCodeSearchControl = new FormControl('');
  panelFilteredActionCodes = signal<{ value: string; label: string; targetDays?: number }[]>([]);

  // Side panel descriptions
  panelSelectedTypeDesc = signal('');
  panelSelectedCodeDesc = signal('');
  panelSelectedActionCodeDesc = signal('');

  // Side panel display values
  panelCurrentDateTime = signal('');
  panelCurrentUser = signal('');
  panelCurrentUserName = signal('');
  panelLoadingCodes = signal(false);

  dlcomAccessGranted = signal(false);

  // Store raw input text to preserve invalid dates
  private targetDateRawInput = '';
  private actionDateRawInput = '';

  // Custom error matchers for date fields
  targetDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.targetDateNativeInput);
    }
  };

  actionDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.actionDateNativeInput);
    }
  };

  ngOnInit(): void {
    // Validate required parameters
    if (!this.donorId) {
      this.snackbarService.showError('Donor ID is required to open communications (Error 18023)');
      this.loggingService.error('DonorCommunications: Missing required parameter donorId');
      this.closePanel.emit();
      return;
    }

    this.loadDonorHeader();
    this.loadCommunications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load donor header information (name, DOB, sex, ABO)
   */
  private loadDonorHeader(): void {
    const donorId = this.donorId;

    this.service.getDonorHeader(donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (header: DonorHeader) => {
          this.donorHeader.set(header);
        },
        error: (error) => {
          this.loggingService.warn('Donor header not available (non-critical)', error);
          // Always set donor header to ensure the section displays
          // Use input properties if available, otherwise set empty values
          this.donorHeader.set({
            name: this.donorName || '-',
            dateOfBirth: this.dob,
            sex: this.sex,
            abo: this.abo
          });
        }
      });
  }

  /**
   * Load communications for donor
   */
  private loadCommunications(): void {
    this.loading.set(true);

    this.service.getCommunications(
      this.donorId,
      1,
      1000, // Load all communications
      this.currentSort.active,
      this.currentSort.direction as 'asc' | 'desc'
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const sorted = this.sortByComDateDesc(response.data);
          this.communications.set(sorted);
          this.loading.set(false);
          this.initialLoading.set(false);
        },
        error: (error) => {
          this.loggingService.error('Failed to load communications', error);
          this.snackbarService.showError('Failed to load communications');
          this.loading.set(false);
          this.initialLoading.set(false);
        }
      });
  }

  /**
   * Handle search bar text change
   */
  onSearch(searchText: string): void {
    this.searchText.set(searchText);
  }

  filteredCommunications = computed(() => {
    const allComms = this.communications();
    const term = this.searchText().toLowerCase().trim();

    if (!term) {
      return allComms;
    }

    return allComms.filter(comm =>
      comm.comType?.toLowerCase().includes(term)
    );
  });

  /**
   * Handle table sort from data-table component
   */
  onTableSort(event: { column: string; direction: 'A' | 'D' | 'default' }): void {
    // Convert data-table sort format to internal sort format
    const sortDirection = event.direction === 'A' ? 'asc' : event.direction === 'D' ? 'desc' : '';
    this.currentSort = { active: event.column, direction: sortDirection as 'asc' | 'desc' | '' };
    this.loadCommunications();
  }

  /**
   * Handle row selection
   */
  onRowClick(communication: DonorCommunication): void {
    this.selectedCommunication.set(communication);
    this.selectedNote.set(communication.comDesc || '');
    this.selectedUserName.set(communication.userName || communication.insertUser);
  }

  // ========== Side Panel Methods ==========

  /**
   * Open side panel for new communication
   */
  openNewPanel(): void {
    this.sidePanelMode.set('new');
    this.sidePanelData.set(null);
    this.chapterDate = this.chapterTimezoneService.getChapterLocalDate();
    const userId = this.loginService.getStoredUsername() || '';
    this.panelCurrentUser.set(userId);
    this.panelCurrentUserName.set(userId);

    if (userId) {
      this.service.getUserFullName(userId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(fullName => this.panelCurrentUserName.set(fullName));
    }

    this.initializePanelForm();
    this.setupPanelSearchControls();
    this.loadPanelLookups();
    this.updatePanelDateTime();

    // Update date/time every minute
    this.dateTimeInterval = window.setInterval(() => {
      this.updatePanelDateTime();
    }, 60000);

    this.sidePanelOpen.set(true);
  }

  /**
   * Open side panel for communication details
   */
  openDetailsPanel(communication: DonorCommunication): void {
    this.sidePanelMode.set('details');
    this.sidePanelData.set(communication);
    this.chapterDate = this.chapterTimezoneService.getChapterLocalDate();
    this.panelCurrentUser.set(this.loginService.getStoredUsername() || '');
    this.dlcomAccessGranted.set(true);

    const dateTime = communication.comDate;
    this.panelCurrentDateTime.set(DateFieldValidationUtility.formatDateTimeForUI(dateTime));

    this.initializePanelForm();
    this.setupPanelSearchControls();
    this.loadExistingPanelData(communication);

    this.sidePanelForm.get('comments')?.disable();
    this.sidePanelForm.get('actionDate')?.disable();

    this.service.checkDlcomAccess()
      .pipe(takeUntil(this.destroy$))
      .subscribe(hasAccess => {
        this.dlcomAccessGranted.set(hasAccess);
        if (hasAccess) {
          this.sidePanelForm.get('comments')?.enable();
          this.sidePanelForm.get('actionDate')?.enable();
        }
      });

    this.sidePanelOpen.set(true);
  }

  /**
   * Close side panel
   */
  closeSidePanel(): void {
    if (this.dateTimeInterval) {
      clearInterval(this.dateTimeInterval);
      this.dateTimeInterval = undefined;
    }

    this.sidePanelOpen.set(false);
    this.sidePanelData.set(null);
    this.sidePanelForm?.reset();
    this.targetDateRawInput = '';
    this.actionDateRawInput = '';
  }

  /**
   * Handle panel button clicks
   */
  onPanelButtonClick(action: string): void {
    if (action === 'save') {
      this.onPanelSave();
    } else if (action === 'cancel' || action === 'close') {
      this.closeSidePanel();
    }
  }

  /**
   * Get footer buttons for side panel
   */
  getPanelButtons(): DialogButton[] {
    const isDetailsMode = this.sidePanelMode() === 'details';

    if (isDetailsMode) {
      const buttons: DialogButton[] = [
        { label: 'CLOSE', action: 'close', variant: 'secondary' }
      ];
      if (this.dlcomAccessGranted()) {
        buttons.push({ label: 'SAVE', action: 'save', variant: 'secondary', disabled: this.isDetailsSaveDisabled });
      }
      return buttons;
    } else {
      return [
        { label: 'CANCEL', action: 'cancel', variant: 'secondary' },
        { label: 'SAVE', action: 'save', variant: 'secondary', disabled: this.isPanelSaveDisabled }
      ];
    }
  }

  /**
   * Escape key handler
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.sidePanelOpen()) {
      this.closeSidePanel();
    }
  }

  /**
   * Open add new communication (now opens side panel instead of dialog)
   */
  /**
   * Open NEW form panel (internal)
   */
  onNew(): void {
    this.openNewPanel();
  }

  /**
   * Open DETAILS panel for selected communication (internal)
   */
  onDetails(): void {
    const communication = this.selectedCommunication();
    if (!communication) {
      this.snackbarService.showError('Please select a communication first');
      return;
    }

    this.openDetailsPanel(communication);
  }

  // ========== Panel Form Logic Methods ==========

  /**
   * Initialize side panel form
   */
  private initializePanelForm(): void {
    const isDetails = this.sidePanelMode() === 'details';

    this.sidePanelForm = this.fb.group({
      communicationType: [{ value: '', disabled: isDetails }, Validators.required],
      communicationCode: [{ value: '', disabled: isDetails }, Validators.required],
      comments: ['', Validators.maxLength(2000)],
      actionCode: [{ value: '', disabled: isDetails }],
      targetDate: [{ value: null, disabled: isDetails }, [
        DateFieldValidationUtility.validDateValidator()
      ]],
      actionDate: [null, [
        DateFieldValidationUtility.validDateValidator()
      ]]
    });

    // Type change handler
    this.sidePanelForm.get('communicationType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(communicationType => {
        this.onPanelTypeChange(communicationType);
      });

    // Code change handler
    this.sidePanelForm.get('communicationCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(communicationCode => {
        this.onPanelCodeChange(communicationCode);
      });

    // Action code change handler
    this.sidePanelForm.get('actionCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(actionCode => {
        this.onPanelActionCodeChange(actionCode);
      });
  }

  /**
   * Setup panel search controls
   */
  private setupPanelSearchControls(): void {
    // Communication Type search
    this.panelComTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.panelFilteredComTypes.set(!term
          ? [...this.panelCommunicationTypes()]
          : this.panelCommunicationTypes().filter(type =>
              type.label.toLowerCase().includes(term) ||
              type.value.toLowerCase().includes(term)
            ));
      });

    // Communication Code search
    this.panelComCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.panelFilteredComCodes.set(!term
          ? [...this.panelCommunicationCodes()]
          : this.panelCommunicationCodes().filter(code =>
              code.label.toLowerCase().includes(term) ||
              code.value.toLowerCase().includes(term)
            ));
      });

    // Action Code search
    this.panelActionCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.panelFilteredActionCodes.set(!term
          ? [...this.panelActionCodes()]
          : this.panelActionCodes().filter(code =>
              code.label.toLowerCase().includes(term) ||
              code.value.toLowerCase().includes(term)
            ));
      });

    // Letter Code search
    this.letterCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredLetterCodes.set(!term
          ? [...this.letterCodes()]
          : this.letterCodes().filter(code =>
              code.code.toLowerCase().includes(term) ||
              (code.description || '').toLowerCase().includes(term)
            ));
      });
  }

  /**
   * Load panel lookups (for new mode)
   */
  private loadPanelLookups(): void {
    this.service.getCommunicationTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          if (!types || !Array.isArray(types) || types.length === 0) {
            this.loggingService.warn('No communication types available from API');
            this.panelCommunicationTypes.set([]);
            this.panelFilteredComTypes.set([]);
            return;
          }

          const typesData = types.map(t => ({
            value: t.code || '',
            label: t.description ? `${t.code} - ${t.description}` : (t.code || 'Unknown')
          }));
          this.panelCommunicationTypes.set(typesData);
          this.panelFilteredComTypes.set([...typesData]);
          this.resolvePendingSendLetterSelection();
        },
        error: (error) => {
          this.loggingService.error('Failed to load communication types', error);
          this.panelCommunicationTypes.set([]);
          this.panelFilteredComTypes.set([]);
        }
      });
  }

  private resolvePendingSendLetterSelection(): void {
    const pending = this.pendingSendLetterSelection;
    if (!pending) return;
    this.pendingSendLetterSelection = null;

    const type = this.panelCommunicationTypes().find(t => t.value === pending.comType);
    this.panelSelectedTypeDesc.set(type ? type.label.split(' - ')[1] || '' : '');
  }

  /**
   * Load existing data into panel form (for details mode)
   */
  private loadExistingPanelData(comm: DonorCommunication): void {
    // Populate dropdown options from existing data
    if (comm.comType) {
      const typeLabel = comm.comTypeDesc
        ? `${comm.comType} - ${comm.comTypeDesc}`
        : comm.comType;
      const typeOption = {
        value: comm.comType,
        label: typeLabel
      };
      this.panelCommunicationTypes.set([typeOption]);
      this.panelFilteredComTypes.set([typeOption]);
    }

    if (comm.comCode) {
      const codeLabel = comm.comCodeDesc
        ? `${comm.comCode} - ${comm.comCodeDesc}`
        : comm.comCode;
      const codeOption = {
        value: comm.comCode,
        label: codeLabel
      };
      this.panelCommunicationCodes.set([codeOption]);
      this.panelFilteredComCodes.set([codeOption]);
    }

    // Set initial action code option from existing data
    if (comm.actionCode) {
      const actionLabel = comm.actionCodeDesc
        ? `${comm.actionCode} - ${comm.actionCodeDesc}`
        : comm.actionCode;
      const actionOption = {
        value: comm.actionCode,
        label: actionLabel
      };
      this.panelActionCodes.set([actionOption]);
      this.panelFilteredActionCodes.set([actionOption]);
    }

    // In details mode, load all action codes for the dropdown so user can change selection
    if (this.sidePanelMode() === 'details' && comm.comType) {
      this.service.getActionCodes(comm.comType)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (codes) => {
            const actionCodesData = codes.map(c => ({
              value: c.code,
              label: `${c.code} - ${c.description}`,
              targetDays: c.targetDays
            }));
            this.panelActionCodes.set(actionCodesData);
            this.panelFilteredActionCodes.set([...actionCodesData]);
          },
          error: () => {
            // Keep the single existing option on error
          }
        });
    }

    // Set form values (use setValue on individual controls to ensure disabled controls also get populated)
    this.sidePanelForm.get('communicationType')?.setValue(comm.comType);
    this.sidePanelForm.get('communicationCode')?.setValue(comm.comCode);
    this.sidePanelForm.get('comments')?.setValue(comm.comDesc || '');
    this.sidePanelForm.get('actionCode')?.setValue(comm.actionCode || '');
    this.sidePanelForm.get('targetDate')?.setValue(comm.targetDate ? moment(comm.targetDate, ['YYYY-MM-DD', 'MM-DD-YYYY', 'MM-dd-yyyy', moment.ISO_8601]) : null);
    this.sidePanelForm.get('actionDate')?.setValue(comm.actionDate ? moment(comm.actionDate, ['YYYY-MM-DD', 'MM-DD-YYYY', 'MM-dd-yyyy', moment.ISO_8601]) : null);

    // Set descriptions
    this.panelSelectedTypeDesc.set(comm.comTypeDesc || '');
    this.panelSelectedCodeDesc.set(comm.comCodeDesc || '');
    this.panelSelectedActionCodeDesc.set(comm.actionCodeDesc || '');
  }

  /**
   * Handle panel type change
   */
  onPanelTypeChange(communicationType: string): void {
    if (!communicationType) {
      this.panelCommunicationCodes.set([]);
      this.panelFilteredComCodes.set([]);
      this.panelActionCodes.set([]);
      this.panelFilteredActionCodes.set([]);
      this.panelSelectedTypeDesc.set('');
      this.sidePanelForm.patchValue({ communicationCode: '' });
      return;
    }

    // Extract description from label
    const type = this.panelCommunicationTypes().find(t => t.value === communicationType);
    this.panelSelectedTypeDesc.set(type ? type.label.split(' - ')[1] || '' : '');

    // Load communication codes
    this.panelLoadingCodes.set(true);
    this.service.getCommunicationCodes(communicationType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          const codesData = codes.map(c => ({
            value: c.code,
            label: `${c.code} - ${c.description}`
          }));
          this.panelCommunicationCodes.set(codesData);
          this.panelFilteredComCodes.set([...codesData]);
          this.panelLoadingCodes.set(false);
        },
        error: (error) => {
          this.loggingService.error('Failed to load communication codes', error);
          this.panelCommunicationCodes.set([]);
          this.panelFilteredComCodes.set([]);
          this.panelLoadingCodes.set(false);
        }
      });

    // Load action codes
    this.service.getActionCodes(communicationType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          const actionCodesData = codes.map(c => ({
            value: c.code,
            label: `${c.code} - ${c.description}`,
            targetDays: c.targetDays
          }));
          this.panelActionCodes.set(actionCodesData);
          this.panelFilteredActionCodes.set([...actionCodesData]);
        },
        error: (error) => {
          this.loggingService.error('Failed to load action codes', error);
          this.panelActionCodes.set([]);
          this.panelFilteredActionCodes.set([]);
        }
      });

    // Clear code selection
    this.sidePanelForm.patchValue({ communicationCode: '' });
    this.panelSelectedCodeDesc.set('');
  }

  /**
   * Handle panel code change
   */
  private onPanelCodeChange(communicationCode: string): void {
    if (!communicationCode) {
      this.panelSelectedCodeDesc.set('');
      return;
    }

    const code = this.panelCommunicationCodes().find(c => c.value === communicationCode);
    this.panelSelectedCodeDesc.set(code ? code.label.split(' - ')[1] || '' : '');
  }

  /**
   * Handle panel action code change
   */
  private onPanelActionCodeChange(actionCode: string): void {
    if (!actionCode) {
      this.panelSelectedActionCodeDesc.set('');
      return;
    }

    const code = this.panelActionCodes().find(c => c.value === actionCode);
    this.panelSelectedActionCodeDesc.set(code ? code.label.split(' - ')[1] || '' : '');

    if (code?.targetDays && code.targetDays > 0 && this.sidePanelMode() === 'new') {
      const targetDate = this.chapterTimezoneService.getChapterLocalDate().add(code.targetDays, 'days');
      this.sidePanelForm.patchValue({ targetDate });
    }
  }

  /**
   * Save panel form
   */
  onPanelSave(): void {
    if (this.sidePanelLoading()) return;

    this.sidePanelForm.markAllAsTouched();

    if (this.hasPanelVisibleDateError) {
      return;
    }

    if (this.sidePanelForm.invalid) {
      return;
    }

    if (this.sidePanelMode() === 'new') {
      this.savePanelNewCommunication();
    } else if (this.sidePanelMode() === 'details') {
      this.updateExistingCommunication();
    }
  }

  get isDetailsSaveDisabled(): boolean {
    if (this.sidePanelLoading()) return true;
    if (this.sidePanelForm?.pristine) return true;
    if (this.hasPanelVisibleDateError) return true;
    return false;
  }

  private updateExistingCommunication(): void {
    const comm = this.sidePanelData();
    if (!comm) return;

    const formValue = this.sidePanelForm.getRawValue();
    const dto: UpdateDonorCommunicationDto = {
      comDesc: formValue.comments,
      actionDate: formValue.actionDate
        ? moment(formValue.actionDate).format('YYYY-MM-DD')
        : undefined
    };

    this.sidePanelLoading.set(true);
    this.service.updateCommunication(this.donorId, comm.sequenceNumber, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.sidePanelLoading.set(false);
          this.snackbarService.showSuccess('Communication updated successfully');
          this.closeSidePanel();
          this.loadCommunications();
        },
        error: (error) => {
          this.sidePanelLoading.set(false);
          this.loggingService.error('Failed to update communication', error);
          const errorMessage = this.extractPanelErrorMessage(error);
          this.snackbarService.showError(errorMessage || 'Failed to update communication');
        }
      });
  }

  /**
   * Save new communication from panel
   */
  private savePanelNewCommunication(): void {
    const request = this.buildPanelCreateRequest();

    // Disable form to prevent modifications during save
    this.sidePanelForm.disable();
    this.sidePanelLoading.set(true);

    this.service.createCommunication(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.sidePanelLoading.set(false);
          this.snackbarService.showSuccess('Communication saved successfully');
          this.closeSidePanel();
          this.loadCommunications();
        },
        error: (error) => {
          this.sidePanelLoading.set(false);
          // Re-enable form on error so user can correct and retry
          this.sidePanelForm.enable();
          this.loggingService.error('Failed to save communication', error);

          const errorMessage = this.extractPanelErrorMessage(error);
          this.snackbarService.showError(errorMessage || 'Failed to save communication');
        }
      });
  }

  /**
   * Build create request from panel form
   */
  private buildPanelCreateRequest(): CreateDonorCommunicationDto {
    const formValue = this.sidePanelForm.getRawValue();

    return {
      donorId: this.donorId,
      comDate: this.getChapterLocalDateTime(),
      comType: formValue.communicationType,
      comCode: formValue.communicationCode,
      comDesc: formValue.comments || undefined,
      actionCode: formValue.actionCode || undefined,
      targetDate: formValue.targetDate
        ? moment(formValue.targetDate).format('YYYY-MM-DD')
        : undefined,
      actionDate: formValue.actionDate
        ? moment(formValue.actionDate).format('YYYY-MM-DD')
        : undefined
    };
  }

  /**
   * Update panel date/time display
   */
  private updatePanelDateTime(): void {
    const chapterNow = this.chapterTimezoneService.getChapterLocalDateTime();
    this.panelCurrentDateTime.set(
      chapterNow.format('DD-MMM-YYYY HH:mm').toUpperCase()
    );
  }

  private getChapterLocalDateTime(): string {
    const chapterNow = this.chapterTimezoneService.getChapterLocalDateTime();
    return chapterNow.format('YYYY-MM-DDTHH:mm:ss');
  }

  // Panel date input handlers
  onPanelTargetDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.targetDateRawInput = input.value;

    const control = this.sidePanelForm.get('targetDate');
    if (control && !control.touched) {
      control.markAsTouched();
    }
  }

  onPanelTargetDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.sidePanelForm.get('targetDate');
      if (!control?.value && this.targetDateRawInput && !input.value) {
        input.value = this.targetDateRawInput;
      }
    }, 0);
  }

  onPanelActionDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.actionDateRawInput = input.value;

    const control = this.sidePanelForm.get('actionDate');
    if (control && !control.touched) {
      control.markAsTouched();
    }
  }

  onPanelActionDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.sidePanelForm.get('actionDate');
      if (!control?.value && this.actionDateRawInput && !input.value) {
        input.value = this.actionDateRawInput;
      }
    }, 0);
  }

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }

  getPanelTargetDateError(): string {
    const control = this.sidePanelForm?.get('targetDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDate')) return 'Target Date is invalid';
    if (!control.value && this.getNativeInputText(this.targetDateNativeInput)) return 'Target Date is invalid';
    return '';
  }

  getPanelActionDateError(): string {
    const control = this.sidePanelForm?.get('actionDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDate')) return 'Action Date is invalid';
    if (!control.value && this.getNativeInputText(this.actionDateNativeInput)) return 'Action Date is invalid';
    return '';
  }

  get hasPanelVisibleDateError(): boolean {
    return !!this.getPanelTargetDateError() || !!this.getPanelActionDateError();
  }

  get isPanelSaveDisabled(): boolean {
    if (this.sidePanelLoading() || this.sidePanelForm?.disabled) {
      return true;
    }

    if (this.sidePanelMode() === 'new') {
      return this.sidePanelForm?.invalid || this.hasPanelVisibleDateError;
    }

    return false;
  }

  getPanelCommentsCharacterCount(): string {
    const control = this.sidePanelForm?.get('comments');
    const length = control?.value?.length || 0;
    return `${length} / 2000`;
  }

  panelPreventLeadingAndMultipleSpaces(event: KeyboardEvent, controlName: string): void {
    const control = this.sidePanelForm?.get(controlName);
    if (control) {
      InputValidationUtil.preventLeadingAndMultipleSpaces(event, control);
    }
  }

  panelTrimTrailingSpaces(controlName: string): void {
    const control = this.sidePanelForm?.get(controlName);
    if (control) {
      InputValidationUtil.trimTrailingSpaces(control);
    }
  }

  panelPreventSpaceInput(event: KeyboardEvent): void {
    InputValidationUtil.preventSpaceInput(event);
  }

  panelTrackByValue(_index: number, item: { value: string; label: string }): string {
    return item.value;
  }

  /**
   * Extract error message from API response
   */
  private extractPanelErrorMessage(error: unknown): string | null {
    // Type guard for error object
    if (!error || typeof error !== 'object') {
      return null;
    }

    const err = error as { error?: { Message?: string; Error?: string; ErrorCode?: string; ErrorResponse?: { Error?: string } } };

    if (err.error?.Message) {
      return err.error.Message;
    }

    if (err.error?.Error) {
      return err.error.Error;
    }

    if (err.error?.ErrorResponse?.Error) {
      return err.error.ErrorResponse.Error;
    }

    const errorCode = err.error?.ErrorCode;
    if (errorCode) {
      const errorMap: Record<string, string> = {
        '18030': 'Comments exceed maximum length (2000 characters)',
        '18031': 'Action Code is too long (max 5 characters)',
        '18032': 'Action Date cannot be in the past',
        '18015': 'Communication Type is required',
        '18016': 'Invalid Communication Type',
        '18013': 'Invalid Communication Code',
        '18017': 'Invalid Action Code',
        '18029': 'Communication Date is required'
      };

      if (errorMap[errorCode]) {
        return errorMap[errorCode];
      }
    }

    return null;
  }

  /**
   * Open view letters dialog
   */
  /**
   * Open VIEW LETTERS panel (internal)
   */
  onViewLetters(): void {
    this.loadLetterHistory();
    this.viewLettersOpen.set(true);
  }

  /**
   * Close VIEW LETTERS panel
   */
  closeViewLetters(): void {
    this.viewLettersOpen.set(false);
    this.selectedLetter.set(null);
    this.letterText.set('');
  }

  getViewLettersButtons(): DialogButton[] {
    return [
      { label: 'CLOSE', action: 'close', variant: 'secondary' }
    ];
  }

  onViewLettersButtonClick(action: string): void {
    if (action === 'close') {
      this.closeViewLetters();
    }
  }

  /**
   * Load letter history for the donor
   */
  private loadLetterHistory(): void {
    this.lettersLoading.set(true);
    this.service.getLetters(this.donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (letters) => {
          this.letterHistory.set(letters);
          this.lettersLoading.set(false);
        },
        error: (error) => {
          this.loggingService.error('Failed to load letter history', error);
          this.snackbarService.showError('Failed to load letter history');
          this.lettersLoading.set(false);
        }
      });
  }

  /**
   * Handle letter row click - load letter text
   */
  onLetterClick(letter: CommunicationLetter): void {
    this.selectedLetter.set(letter);
    this.service.getLetterText(this.donorId, letter.letterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (text) => {
          this.letterText.set(text || 'No letter content available');
        },
        error: (error) => {
          this.loggingService.error('Failed to load letter text', error);
          this.snackbarService.showError('Failed to load letter content');
        }
      });
  }

  /**
   * Open SEND LETTER panel (internal)
   */
  onSendLetters(): void {
    this.cancelSendLetterLoad$.next();
    this.initializeSendLetterForm();
    this.setupPanelSearchControls();

    // Load communication types only if not already loaded
    const typesAlreadyLoaded = this.panelCommunicationTypes().length > 0;
    if (!typesAlreadyLoaded) {
      this.loadPanelLookups();
    }

    this.loadLetterCodes();

    // Pre-populate from selected communication if available
    const selected = this.selectedCommunication();
    if (selected?.comType) {
      this.sendLetterForm.patchValue({ communicationType: selected.comType });

      if (typesAlreadyLoaded) {
        const type = this.panelCommunicationTypes().find(t => t.value === selected.comType);
        this.panelSelectedTypeDesc.set(type ? type.label.split(' - ')[1] || '' : '');
      } else {
        this.pendingSendLetterSelection = { comType: selected.comType, comCode: selected.comCode || '' };
      }

      this.panelLoadingCodes.set(true);
      this.service.getCommunicationCodes(selected.comType)
        .pipe(takeUntil(this.cancelSendLetterLoad$))
        .subscribe({
          next: (codes) => {
            const codesData = codes.map(c => ({
              value: c.code,
              label: `${c.code} - ${c.description}`
            }));
            this.panelCommunicationCodes.set(codesData);
            this.panelFilteredComCodes.set([...codesData]);
            this.panelLoadingCodes.set(false);

            if (selected.comCode) {
              this.sendLetterForm.patchValue({ communicationCode: selected.comCode });
              this.onSendLetterCodeChange();
            }
          },
          error: (error) => {
            this.loggingService.error('Failed to load communication codes', error);
            this.panelCommunicationCodes.set([]);
            this.panelFilteredComCodes.set([]);
            this.panelLoadingCodes.set(false);
          }
        });
    }

    this.sendLetterOpen.set(true);
  }

  /**
   * Close SEND LETTER panel
   */
  closeSendLetter(): void {
    this.cancelSendLetterLoad$.next();
    this.sendLetterOpen.set(false);
    this.sendLetterForm?.reset();
    this.generatedLetterText.set('');
    this.selectedLetterCode.set(null);
    this.panelSelectedTypeDesc.set('');
    this.panelSelectedCodeDesc.set('');
    this.pendingSendLetterSelection = null;
    this.letterCodeSearchControl.reset();
  }

  /**
   * Initialize send letter form
   */
  private initializeSendLetterForm(): void {
    this.sendLetterForm = this.fb.group({
      communicationType: ['', Validators.required],
      communicationCode: ['', Validators.required],
      comments: [''],
      letterCode: ['', Validators.required]
    });
  }

  /**
   * Load available letter codes
   */
  private loadLetterCodes(): void {
    this.sendLetterLoading.set(true);
    this.service.getLetterCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.letterCodes.set(codes);
          this.filteredLetterCodes.set([...codes]);
          this.sendLetterLoading.set(false);
        },
        error: (error) => {
          this.loggingService.error('Failed to load letter codes', error);
          this.snackbarService.showError('Failed to load letter codes');
          this.sendLetterLoading.set(false);
        }
      });
  }

  /**
   * Handle Generate Letter button click
   */
  onGenerateLetter(): void {
    if (!this.sendLetterForm.valid) {
      this.snackbarService.showError('Please fill in all required fields');
      return;
    }

    const templateText = this.selectedLetterCode()?.letterText;
    if (!templateText) {
      this.snackbarService.showError('Letter template not loaded. Please select a letter code first.');
      return;
    }

    const formValue = this.sendLetterForm.value;
    this.sendLetterLoading.set(true);

    this.service.generateLetter(
      this.donorId,
      formValue.letterCode,
      formValue.communicationType,
      formValue.communicationCode,
      templateText
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (letterText) => {
          this.generatedLetterText.set(letterText);
          this.sendLetterLoading.set(false);
        },
        error: (error) => {
          this.loggingService.error('Failed to generate letter', error);
          this.snackbarService.showError('Failed to generate letter');
          this.sendLetterLoading.set(false);
        }
      });
  }

  /**
   * Handle letter code selection change
   */
  onLetterCodeChange(letterCode: string): void {
    const selected = this.letterCodes().find(code => code.code === letterCode);
    this.selectedLetterCode.set(selected || null);
    this.generatedLetterText.set('');
  }

  /**
   * Auto-retrieve letter template when the Letter Code dropdown closes with a value selected
   */
  onLetterCodeDropdownClosed(): void {
    const letterCode = this.sendLetterForm?.get('letterCode')?.value;
    if (letterCode) {
      this.retrieveLetterTemplateByCode(letterCode);
    }
  }

  private retrieveLetterTemplateByCode(letterCode: string): void {
    this.service.retrieveLetterTemplate(letterCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (template) => {
          this.selectedLetterCode.set(template);
        },
        error: (error) => {
          this.loggingService.error('Failed to retrieve letter template', error);
          this.snackbarService.showError('Failed to retrieve letter template');
        }
      });
  }

  /**
   * Handle communication type change in Send Letter form
   */
  onSendLetterTypeChange(): void {
    const selectedType = this.sendLetterForm?.get('communicationType')?.value;

    if (!selectedType) {
      this.panelCommunicationCodes.set([]);
      this.panelFilteredComCodes.set([]);
      this.panelSelectedTypeDesc.set('');
      return;
    }

    // Clear the communication code field
    this.sendLetterForm?.patchValue({ communicationCode: '' });

    // Extract description from label
    const type = this.panelCommunicationTypes().find(t => t.value === selectedType);
    this.panelSelectedTypeDesc.set(type ? type.label.split(' - ')[1] || '' : '');

    // Load communication codes
    this.panelLoadingCodes.set(true);
    this.service.getCommunicationCodes(selectedType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          const codesData = codes.map(c => ({
            value: c.code,
            label: `${c.code} - ${c.description}`
          }));
          this.panelCommunicationCodes.set(codesData);
          this.panelFilteredComCodes.set([...codesData]);
          this.panelLoadingCodes.set(false);
        },
        error: (error) => {
          this.loggingService.error('Failed to load communication codes', error);
          this.panelCommunicationCodes.set([]);
          this.panelFilteredComCodes.set([]);
          this.panelLoadingCodes.set(false);
        }
      });
  }

  /**
   * Handle communication code change in Send Letter form
   */
  onSendLetterCodeChange(): void {
    const selectedCode = this.sendLetterForm?.get('communicationCode')?.value;

    if (!selectedCode) {
      this.panelSelectedCodeDesc.set('');
      return;
    }

    const code = this.panelCommunicationCodes().find(c => c.value === selectedCode);
    this.panelSelectedCodeDesc.set(code ? code.label.split(' - ')[1] || '' : '');
  }

  /**
   * Handle Save & Print button click
   */
  onSaveAndPrintLetter(): void {
    if (!this.sendLetterForm.valid) {
      this.snackbarService.showError('Please fill in all required fields');
      return;
    }

    const formValue = this.sendLetterForm.value;
    this.sendLetterLoading.set(true);

    this.service.saveAndPrintLetter(
      this.donorId,
      formValue.letterCode,
      formValue.communicationType,
      formValue.communicationCode,
      this.generatedLetterText(),
      formValue.comments
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.sendLetterLoading.set(false);
          this.generateAndPrintPdf(this.generatedLetterText());
          this.snackbarService.showSuccess('Letter saved successfully');
          this.loadCommunications();
          this.closeSendLetter();
        },
        error: (error) => {
          this.loggingService.error('Failed to save letter', error);
          this.snackbarService.showError('Failed to save letter');
          this.sendLetterLoading.set(false);
        }
      });
  }

  /**
   * Get footer buttons for send letter panel
   */
  getSendLetterButtons(): DialogButton[] {
    const formInvalid = this.sendLetterForm?.invalid || false;
    const isLoading = this.sendLetterLoading();

    return [
      { label: 'CLOSE', action: 'close', variant: 'secondary' },
      { label: 'SAVE & PRINT', action: 'save & print', variant: 'secondary', disabled: formInvalid || isLoading || !this.generatedLetterText() },
      { label: 'GENERATE', action: 'generate', variant: 'secondary', disabled: formInvalid || isLoading || !!this.generatedLetterText() },
      { label: 'RETRIEVE', action: 'retrieve', variant: 'secondary', disabled: !this.sendLetterForm?.get('letterCode')?.value || isLoading || !!this.generatedLetterText() }
    ];
  }

  /**
   * Handle send letter panel button clicks
   */
  onSendLetterButtonClick(action: string): void {
    if (action === 'close') {
      this.closeSendLetter();
    } else if (action === 'save & print') {
      this.onSaveAndPrintLetter();
    } else if (action === 'generate') {
      this.onGenerateLetter();
    } else if (action === 'retrieve') {
      const letterCode = this.sendLetterForm.get('letterCode')?.value;
      if (letterCode) {
        this.retrieveLetterTemplateByCode(letterCode);
      }
    }
  }

  private generateAndPrintPdf(text: string): void {
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
      pdf.setFont('courier');
      pdf.setFontSize(10);
      const lines = text.split('\n');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const lineHeight = 5;
      const margin = 15;
      const maxLineWidth = pageWidth - margin * 2;
      let yPosition = margin;
      lines.forEach((line) => {
        const wrappedLines = pdf.splitTextToSize(line || ' ', maxLineWidth);
        wrappedLines.forEach((wrappedLine: string) => {
          if (yPosition + lineHeight > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(wrappedLine, margin, yPosition);
          yPosition += lineHeight;
        });
      });
      pdf.save(`letter-${this.donorId}.pdf`);
    } catch {
      this.snackbarService.showError('Failed to generate PDF for printing');
    }
  }

  /**
   * Close panel - emit event to parent
   */
  onClose(): void {
    this.closePanel.emit();
  }

  private sortByComDateDesc(data: DonorCommunication[]): DonorCommunication[] {
    return [...data].sort((a, b) => {
      const dateA = this.parseDateValue(a.comDate);
      const dateB = this.parseDateValue(b.comDate);
      return dateB - dateA;
    });
  }

  private parseDateValue(date: string | null | undefined): number {
    if (!date) return 0;
    const m = moment(date, ['YYYY-MM-DDTHH:mm:ss', 'YYYY-MM-DD', 'MM-DD-YYYY', moment.ISO_8601], true);
    if (m.isValid()) return m.valueOf();
    const fallback = moment(date);
    return fallback.isValid() ? fallback.valueOf() : 0;
  }

  formatDonorName(name: string | null | undefined): string {
    if (!name) return '-';
    return name.replace(/[A-Za-z]+/g, word => {
      if (word.length <= 1) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '-';

    // Try ISO format first (YYYY-MM-DD or ISO 8601)
    let m = moment(date, ['YYYY-MM-DD', moment.ISO_8601], true);

    // If not valid, try common US formats
    if (!m.isValid()) {
      m = moment(date, ['MM-DD-YYYY', 'M-D-YYYY', 'MM/DD/YYYY'], true);
    }

    // If still not valid, let moment parse it (with deprecation warning)
    if (!m.isValid()) {
      m = moment(date);
    }

    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  /**
   * TrackBy function for dropdown options
   */
  trackByValue(_index: number, item: { value: string; label: string }): string {
    return item.value;
  }

  /**
   * TrackBy function for table rows
   */
  trackByCommunication(_index: number, item: DonorCommunication): string {
    return `${item.donorId}-${item.sequenceNumber}`;
  }
}
