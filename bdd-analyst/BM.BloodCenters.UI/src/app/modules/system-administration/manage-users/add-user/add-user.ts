import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import {
  noWhitespaceOnlyValidator,
  trimControlValue,
  codeFieldValidator,
  strictEmailValidator
} from '@shared/validators/input.validators';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { Subject, takeUntil } from 'rxjs';

import {
  Chapter,
  Warehouse,
  CHAPTER_TABLE_COLUMNS,
  WAREHOUSE_TABLE_COLUMNS,
  SectionId
} from '../models/user.model';
import { getChapterStatus } from '../models/user.utils';
import { ScrollHandlerService } from '../services/scroll-handler.service';
import { AssignChapterDialogComponent } from '../assignChapter/assignChapter';
import {
  ChapterLookup,
  WarehouseLookup,
  LabCodeLookup,
  PrinterCodeLookup,
  GroupLookup,
  AccessLevelLookup,
  CreateUserRequest,
  ChapterAssignment
} from '../models/service.model';
import { UserApiService } from '../services/user.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import * as moment from 'moment';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatTableModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    SearchBar
  ],
  providers: [
    ScrollHandlerService,
    { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
    {
      provide: DateAdapter,
      useClass: ChapterAwareDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: true } }
  ],
  templateUrl: './add-user.html',
  styleUrls: ['./add-user.scss']
})
export class AddUserComponent implements OnInit, OnDestroy {
  private readonly headerService = inject(HeaderService);
  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  private getChapterMinDate(): moment.Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  // Page header configuration
  readonly headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Manage Users', link: '/system-administration/user-admin/manage-users' }
    ],
    title: 'Add New User',
    showBackButton: true,
    onBackClick: () => this.onBack()
  };

  // Form
  userForm: FormGroup;
  isSubmitting = signal(false);

  // Navigation
  activeSection = signal<SectionId>('personal-info');

  // Table configurations
  displayedColumns = WAREHOUSE_TABLE_COLUMNS;
  chaptersDisplayedColumns = CHAPTER_TABLE_COLUMNS;

  // Data sources
  warehouseDataSource: Warehouse[] = this.getMockWarehouseData();
  chaptersDataSource: Chapter[] = [];
  filteredChaptersDataSource: Chapter[] = [];

  // Sorting for chapters table
  chapterSortColumn: 'chapterId' | 'chapterName' = 'chapterId';
  chapterSortDirection: 'asc' | 'desc' = 'desc';

  // Search
  chapterSearchTerm: string = '';
  chapterSearchConfig: SearchBarConfig = {
    placeholder: 'Search by Chapter ID or Chapter Name',
    minLength: 1,
    ariaLabel: 'Search by Chapter ID or Chapter Name',
    alwaysShowTooltip: true
  };

  // Lookup data
  chapters = signal<ChapterLookup[]>([]);
  warehouses = signal<WarehouseLookup[]>([]);
  labCodes = signal<LabCodeLookup[]>([]);
  printerCodes = signal<PrinterCodeLookup[]>([]);
  groups = signal<GroupLookup[]>([]);
  accessLevels = signal<AccessLevelLookup[]>([]);

  // Search controls and filtered options
  labCodeSearchControl = new FormControl('');
  filteredLabCodes: LabCodeLookup[] = [];

  printerIdSearchControl = new FormControl('');
  filteredPrinterCodes: PrinterCodeLookup[] = [];

  warehouseSearchControl = new FormControl('');
  filteredWarehouses: WarehouseLookup[] = [];

  groupIdSearchControl = new FormControl('');
  filteredGroups: GroupLookup[] = [];

  accessLevelSearchControl = new FormControl('');
  filteredAccessLevels: AccessLevelLookup[] = [];

  private destroy$ = new Subject<void>();

  // Minimum date for effective date (chapter's local date)
  minEffectiveDate: any;

  // Minimum date for termination date: max(chapter's today, effective date)
  get minTerminationDate(): any {
    const effectiveDate = this.userForm.get('effectiveDate')?.value;
    if (!effectiveDate) return this.minEffectiveDate;
    const chapterToday = this.getChapterMinDate();

    // Use DateFieldUtility to serialize dates for comparison
    const effStr = DateFieldValidationUtility.serializeDateForApi(effectiveDate) || '';
    const todayStr = DateFieldValidationUtility.serializeDateForApi(chapterToday) || '';

    return effStr > todayStr ? effectiveDate : chapterToday;
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private dialog: MatDialog,
    private scrollHandler: ScrollHandlerService,
    private userApiService: UserApiService,
    private snackBar: MatSnackBar,
    private dateAdapter: DateAdapter<any>
  ) {
    // Initialize min date using chapter's local date (UTC mode for datepicker compatibility)
    this.minEffectiveDate = this.getChapterMinDate();

    // Create form with proper validators
    this.userForm = this.fb.group({
      // Personal Information
      userId: ['', [Validators.required, Validators.maxLength(10), noWhitespaceOnlyValidator(), codeFieldValidator()]],
      firstName: ['', [Validators.required, Validators.maxLength(25), noWhitespaceOnlyValidator()]],
      lastName: ['', [Validators.required, Validators.maxLength(30), noWhitespaceOnlyValidator()]],
      nameInitials: ['', [Validators.maxLength(3), noWhitespaceOnlyValidator()]], // DB: VARCHAR2(3)
      userClass: ['', [Validators.maxLength(5), noWhitespaceOnlyValidator()]], // DB: VARCHAR2(5)
      email: ['', [Validators.required, strictEmailValidator(), Validators.maxLength(128), noWhitespaceOnlyValidator()]],
      staffNumber: ['', [Validators.required, Validators.maxLength(6), Validators.pattern(/^[a-zA-Z0-9]*$/), noWhitespaceOnlyValidator()]],
      adUserId: ['', [Validators.pattern(/^[a-zA-Z0-9]*$/), Validators.maxLength(20), noWhitespaceOnlyValidator()]],

      // System Configuration
      labCode: [''],
      labDescription: [{ value: '', disabled: true }],
      qcUserId: ['', [Validators.maxLength(10), Validators.pattern(/^[a-zA-Z0-9]*$/), noWhitespaceOnlyValidator()]], // Conservative limit - confirm with DB schema
      printerId: [''],
      printerDescription: [{ value: '', disabled: true }], // Conservative limit - confirm with DB schema

      // Access Controls and Dates
      effectiveDate: ['', [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator(this.chapterOffset)]],
      terminationDate: ['', [DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)]],

      // Warehouse
      assignedWarehouse: ['', Validators.required],

      // Group Information
      groupCode: ['', Validators.required],
      groupDescription: [{ value: '', disabled: true }],
      accessLevel: ['', Validators.required]
    });

    // Setup auto-population watchers
    this.setupLabCodeWatcher();
    this.setupPrinterCodeWatcher();
    this.setupGroupCodeWatcher();
    this.setupDateValidation();
    this.setupDateFormatting();
  }

  ngOnInit(): void {
    // Set date locale for proper formatting
    this.dateAdapter.setLocale('en-US');

    // ChapterAwareDateAdapter automatically uses chapter timezone via HeaderService
    this.scrollHandler.initialize();

    // Subscribe to active section changes
    this.scrollHandler.getActiveSection().subscribe(section => {
      this.activeSection.set(section);
    });

    // Load lookup data
    this.loadLookupData();

    // Setup search controls
    this.setupSearchControls();

    // Subscribe to chapter changes
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.scrollHandler.cleanup();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to chapter changes to refresh dropdown data
   * Following the pattern from donor-access-class.ts
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Clear form and reload lookup data when chapter changes
        this.onClearAll();
        this.loadLookupData();
      });
  }

  // ============================================================================
  // AUTO-POPULATION WATCHERS
  // ============================================================================

  private setupLabCodeWatcher(): void {
    this.userForm.get('labCode')?.valueChanges.subscribe(labCode => {
      if (labCode) {
        const lab = this.labCodes().find(l => l.labCode === labCode);
        this.userForm.get('labDescription')?.setValue(lab?.labDescription || '');
      } else {
        this.userForm.get('labDescription')?.setValue('');
      }
    });
  }

  private setupPrinterCodeWatcher(): void {
    this.userForm.get('printerId')?.valueChanges.subscribe(printerId => {
      if (printerId) {
        const printer = this.printerCodes().find(p => p.printerId === printerId);
        this.userForm.get('printerDescription')?.setValue(printer?.printerDescription || '');
      } else {
        this.userForm.get('printerDescription')?.setValue('');
      }
    });
  }

  private setupGroupCodeWatcher(): void {
    this.userForm.get('groupCode')?.valueChanges.subscribe(groupCode => {
      if (groupCode) {
        const group = this.groups().find(g => g.groupId === groupCode);
        this.userForm.get('groupDescription')?.setValue(group?.description || '');
      } else {
        this.userForm.get('groupDescription')?.setValue('');
      }
    });
  }

  private setupDateValidation(): void {
    this.userForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.userForm.get('terminationDate')?.updateValueAndValidity();
      });
  }

  private setupDateFormatting(): void {
    // Date formatting is handled automatically by DateFieldUtility and ChapterAwareDateAdapter
    // No custom date formatting tracking needed
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  private loadLookupData(): void {
    const chapterId = this.headerService.getCurrentChapterId();

    // Load chapters
    this.userApiService.getChapters(chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.chapters.set(data),
        error: () => {
          this.showError('Failed to load chapters.');
        }
      });

    // Load warehouses
    this.userApiService.getWarehouses(chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.warehouses.set(data);
          this.filteredWarehouses = data;
        },
        error: () => {
          this.showError('Failed to load warehouses.');
        }
      });

    // Load lab codes
    this.userApiService.getLabCodes(chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.labCodes.set(data);
          this.filteredLabCodes = data;
        },
        error: () => {
          this.showError('Failed to load lab codes.');
        }
      });

    // Load printer codes
    this.userApiService.getPrinterCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.printerCodes.set(data);
          this.filteredPrinterCodes = data;
        },
        error: () => {
          this.showError('Failed to load printer codes.');
        }
      });

    // Load groups
    this.userApiService.getGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.groups.set(data);
          this.filteredGroups = data;
        },
        error: () => {
          this.showError('Failed to load groups.');
        }
      });

    // Load access levels
    this.userApiService.getAccessLevels()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.accessLevels.set(data);
          this.filteredAccessLevels = data;
        },
        error: () => {
          this.showError('Failed to load access levels.');
        }
      });
  }

  private setupSearchControls(): void {
    // Lab Code search
    this.labCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredLabCodes = this.labCodes().filter(lab =>
          lab.labCode.toLowerCase().includes(term) ||
          lab.labDescription.toLowerCase().includes(term)
        );
      });

    // Printer ID search
    this.printerIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredPrinterCodes = this.printerCodes().filter(printer =>
          printer.printerId.toLowerCase().includes(term) ||
          printer.printerDescription.toLowerCase().includes(term)
        );
      });

    // Warehouse search
    this.warehouseSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredWarehouses = this.warehouses().filter(warehouse =>
          warehouse.warehouseID.toLowerCase().includes(term) ||
          warehouse.warehouseName.toLowerCase().includes(term)
        );
      });

    // Group ID search
    this.groupIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredGroups = this.groups().filter(group =>
          group.groupId.toLowerCase().includes(term) ||
          group.description.toLowerCase().includes(term)
        );
      });

    // Access Level search
    this.accessLevelSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredAccessLevels = this.accessLevels().filter(level =>
          level.label.toLowerCase().includes(term) ||
          level.value.toString().includes(term)
        );
      });
  }

  // ============================================================================
  // SEARCH FUNCTIONALITY
  // ============================================================================

  onChapterSearch(): void {
    if (!this.chapterSearchTerm || this.chapterSearchTerm.trim() === '') {
      this.filteredChaptersDataSource = [...this.chaptersDataSource];
      this.applySorting();
      return;
    }

    const searchTerm = this.chapterSearchTerm.toLowerCase().trim();

    this.filteredChaptersDataSource = this.chaptersDataSource.filter(chapter =>
      chapter.chapterId.toLowerCase().includes(searchTerm) ||
      chapter.chapterName.toLowerCase().includes(searchTerm)
    );
    this.applySorting();
  }

  // ============================================================================
  // SORTING FUNCTIONALITY
  // ============================================================================

  toggleChapterSort(column: 'chapterId' | 'chapterName'): void {
    if (this.chapterSortColumn === column) {
      // Toggle direction if same column
      this.chapterSortDirection = this.chapterSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, default to ascending
      this.chapterSortColumn = column;
      this.chapterSortDirection = 'asc';
    }
    this.applySorting();
  }

  private applySorting(): void {
    const col = this.chapterSortColumn;
    const dir = this.chapterSortDirection;
    this.filteredChaptersDataSource = [...this.filteredChaptersDataSource].sort((a, b) => {
      const comparison = a[col].toLowerCase().localeCompare(b[col].toLowerCase());
      return dir === 'asc' ? comparison : -comparison;
    });
  }

  // ============================================================================
  // NAVIGATION METHODS
  // ============================================================================

  scrollToSection(sectionId: SectionId): void {
    this.scrollHandler.scrollToSection(sectionId);
  }

  onBack(): void {
    this.router.navigateByUrl('/system-administration/user-admin/manage-users');
  }

  // ============================================================================
  // FORM ACTIONS
  // ============================================================================

  onCancel(): void { this.onBack() }

  onClearAll(): void {
    this.userForm.reset();
    this.chaptersDataSource = [];
    this.filteredChaptersDataSource = [];
    this.chapterSearchTerm = '';
  }

  onSave(): void {
    if (this.userForm.invalid) {
      this.markFormAsTouched();
      this.showError('Please fill in all required fields');
      this.scrollToFirstError();
      return;
    }

    if (this.chaptersDataSource.length === 0) {
      this.showError('Please assign at least one chapter');
      this.scrollToSection('warehouse');
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.userForm.getRawValue();

    // Build the request payload
    const request: CreateUserRequest = {
      userId: formValue.userId,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      initials: formValue.nameInitials || undefined,
      userClass: formValue.userClass || undefined,
      userEmail: formValue.email,
      staffNo: formValue.staffNumber || undefined,
      adUserId: formValue.adUserId || undefined,
      labCode: (formValue.labCode && formValue.labCode.trim()) || undefined,
      labDesciption: (formValue.labDescription && formValue.labDescription.trim()) || undefined,
      ktUserId: formValue.qcUserId || undefined,
      printerId: formValue.printerId || undefined,
      printerDescription: formValue.printerDescription || undefined,
      effectiveDate: formValue.effectiveDate ? DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '' : '',
      terminationDate: formValue.terminationDate ? DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) || undefined : undefined,
      warehouseID: formValue.assignedWarehouse,
      chapters: this.buildChapterAssignments(),
      warehouses: [{ warehouseID: formValue.assignedWarehouse }],
      groupCode: formValue.groupCode,
      accessLevel: parseInt(formValue.accessLevel)
    };

    this.userApiService.createUser(request).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        const successMessage = response.message || `User ${request.userId} created successfully!`;
        this.showSuccess(successMessage);
        // Navigate back to Manage User screen after API completes
        setTimeout(() => {
          this.router.navigateByUrl('/system-administration/user-admin/manage-users');
        }, 1500);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        const errorMessage = this.parseErrorMessage(error);
        this.showError(errorMessage);
      }
    });
  }

  private buildChapterAssignments(): ChapterAssignment[] {
    return this.chaptersDataSource.map(chapter => ({
      chapterID: chapter.chapterId,
      effectiveDate: this.userApiService.parseDateToISO(chapter.effectiveDate),
      terminationDate: chapter.terminationDate
        ? this.userApiService.parseDateToISO(chapter.terminationDate)
        : undefined,
      defaultFlag: chapter.isDefault ? 'Y' : 'N'
    }));
  }

  // ============================================================================
  // WAREHOUSE METHODS
  // ============================================================================

  onViewAssignedWarehouses(): void {
    // Feature disabled in Add User mode
  }

  // ============================================================================
  // CHAPTER METHODS
  // ============================================================================

  onAssignChapter(): void {
    // Prevent dialog from triggering form validation
    if (!this.userForm.get('assignedWarehouse')?.value) {
      this.showError('Please select an assigned warehouse first');
      return;
    }

    // Convert existing chapters to the format expected by the dialog
    const existingChapters = this.chaptersDataSource.map(chapter => ({
      chapterId: chapter.chapterId,
      chapterName: chapter.chapterName,
      effectiveDate: chapter.effectiveDate,
      terminationDate: chapter.terminationDate,
      isDefault: chapter.isDefault
    }));

    const dialogRef = this.dialog.open(AssignChapterDialogComponent, {
      width: '960px',
      maxWidth: '100vw',
      height: '100vh',
      disableClose: false,
      data: {
        assignedWarehouse: this.userForm.get('assignedWarehouse')?.value,
        editMode: false,
        chapters: this.chapters(),
        existingChapters: existingChapters
      },
      position: {
        right: '0'
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && Array.isArray(result)) {
        this.addMultipleChapters(result);
      }
    });
  }

  onEditChapter(chapter: Chapter): void {
    const dialogRef = this.dialog.open(AssignChapterDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      data: {
        assignedWarehouse: this.userForm.get('assignedWarehouse')?.value,
        editMode: true,
        chapter: chapter,
        chapters: this.chapters()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && Array.isArray(result) && result.length > 0) {
        this.updateChapter(chapter.chapterId, result[0]);
      }
    });
  }

  onDefaultToggle(chapter: Chapter): void {
    // Allow toggling default on/off instead of forcing one default
    if (chapter.isDefault) {
      // If already default, unset it
      chapter.isDefault = false;
    } else {
      // If not default, make it default and unset others
      this.chaptersDataSource.forEach(c => {
        c.isDefault = c === chapter;
      });
    }
    this.chaptersDataSource = [...this.chaptersDataSource];
    this.filteredChaptersDataSource = [...this.filteredChaptersDataSource];
  }

  onDeleteChapter(chapter: Chapter): void {
    // Remove the chapter from the data source
    const index = this.chaptersDataSource.findIndex(c => c.chapterId === chapter.chapterId);
    if (index !== -1) {
      this.chaptersDataSource.splice(index, 1);
      this.chaptersDataSource = [...this.chaptersDataSource];
      this.filteredChaptersDataSource = this.chaptersDataSource.filter(c =>
        c.chapterId.toLowerCase().includes(this.chapterSearchTerm.toLowerCase()) ||
        c.chapterName.toLowerCase().includes(this.chapterSearchTerm.toLowerCase())
      );
      this.applySorting();

      // If deleted chapter was default and there are remaining chapters, make first one default
      if (chapter.isDefault && this.chaptersDataSource.length > 0) {
        this.chaptersDataSource[0].isDefault = true;
      }

      this.showSuccess('Chapter removed successfully');
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private addMultipleChapters(chapters: any[]): void {
    // Replace entire chapters list with the result from dialog (includes existing + new + deletions)
    const updatedChapters: Chapter[] = chapters.map((chapterData, index) => {
      // Determine default: use existing isDefault if provided, otherwise first chapter is default
      const isDefault = chapterData.isDefault !== undefined
        ? chapterData.isDefault
        : (index === 0 && chapters.length > 0);

      return {
        chapterId: chapterData.chapterId,
        chapterName: chapterData.chapterName,
        effectiveDate: chapterData.effectiveDate,
        terminationDate: chapterData.terminationDate || '',
        status: getChapterStatus(
          this.parseDate(chapterData.effectiveDate),
          chapterData.terminationDate ? this.parseDate(chapterData.terminationDate) : null,
          this.chapterOffset
        ),
        isDefault: isDefault
      };
    });

    // Ensure at least one chapter is marked as default if we have chapters
    if (updatedChapters.length > 0) {
      const hasDefault = updatedChapters.some(ch => ch.isDefault);
      if (!hasDefault) {
        updatedChapters[0].isDefault = true;
      }
    }

    // Replace the entire list (dialog returns all chapters, not just new ones)
    this.chaptersDataSource = [...updatedChapters];
    this.filteredChaptersDataSource = [...this.chaptersDataSource];
    this.applySorting();

    // Show success message
    this.showSuccess('Chapter assignments updated successfully');
  }

  private updateChapter(chapterId: string, chapterData: any): void {
    const index = this.chaptersDataSource.findIndex(c => c.chapterId === chapterId);

    if (index !== -1) {
      this.chaptersDataSource[index] = {
        chapterId: chapterData.chapterId,
        chapterName: chapterData.chapterName,
        effectiveDate: chapterData.effectiveDate,
        terminationDate: chapterData.terminationDate || '',
        status: getChapterStatus(
          this.parseDate(chapterData.effectiveDate),
          chapterData.terminationDate ? this.parseDate(chapterData.terminationDate) : null,
          this.chapterOffset
        ),
        isDefault: this.chaptersDataSource[index].isDefault
      };

      this.chaptersDataSource = [...this.chaptersDataSource];
      this.onChapterSearch(); // Reapply search filter
    }
  }

  private parseDate(dateStr: string): Date {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(dateStr);
  }

  private markFormAsTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.markAsTouched();
    });
  }

  private scrollToFirstError(): void {
    // Define form sections and their required fields in order
    const sections: { id: SectionId; fields: string[] }[] = [
      { id: 'personal-info', fields: ['userId', 'firstName', 'lastName', 'email'] },
      { id: 'system-config', fields: [] },
      { id: 'access-controls', fields: ['effectiveDate'] },
      { id: 'warehouse', fields: ['assignedWarehouse'] },
      { id: 'group-info', fields: ['groupCode', 'accessLevel'] }
    ];

    // Find the first section with an error
    for (const section of sections) {
      for (const fieldName of section.fields) {
        const control = this.userForm.get(fieldName);
        if (control && control.invalid) {
          this.scrollToSection(section.id);
          return;
        }
      }
    }
  }

  private getMockWarehouseData(): Warehouse[] {
    return [];
  }

  /**
   * Prevents special characters from being entered in alphanumeric-only fields
   * Allows: letters (a-z, A-Z), numbers (0-9), Backspace, Delete, Tab, Arrow keys, etc.
   */
  onAlphanumericKeyDown(event: KeyboardEvent): void {
    const key = event.key;

    // Allow control keys: Backspace, Delete, Tab, Escape, Enter, Arrow keys, Home, End
    const controlKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
                        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                        'Home', 'End'];

    if (controlKeys.includes(key)) {
      return; // Allow control keys
    }

    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
    if (event.ctrlKey || event.metaKey) {
      return; // Allow copy/paste/select all
    }

    // Check if the key is alphanumeric (a-z, A-Z, 0-9)
    const isAlphanumeric = /^[a-zA-Z0-9]$/.test(key);

    if (!isAlphanumeric) {
      event.preventDefault(); // Block special characters
    }
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      panelClass: ['success-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'right'
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      panelClass: ['error-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'right'
    });
  }

  private parseErrorMessage(error: any): string {
    // Extract error message from various error formats
    const errorResponseError = error?.error?.errorResponse?.error || '';
    const errorCode = error?.error?.errorCode || '';
    const errorField = error?.error?.error || '';
    const errorMsg = error?.message || error?.error?.message || error?.error?.Message || '';
    const errorDetails = error?.error?.Error?.ErrorMessage || error?.error?.error?.ErrorMessage || '';
    const oracleError = error?.error?.errorMessage || '';
    const responseMessage = error?.error?.message || '';
    const nestedErrorMessage = error?.error?.error?.errorMessage || '';

    // Priority 1: Check for top-level message in response body (most user-friendly)
    if (responseMessage && responseMessage !== 'Failed to create user') {
      return responseMessage;
    }

    // Priority 2: Check for nested error message
    if (nestedErrorMessage) {
      return nestedErrorMessage;
    }

    // Priority 3: Check for errorResponse.error (from standardized API response)
    if (errorResponseError) {
      return errorResponseError;
    }

    // Priority 4: Check error field - only if it's a string, not an object
    if (errorField && typeof errorField === 'string') {
      return errorField;
    }

    // Check for duplicate User ID (Oracle unique constraint violation)
    if (errorMsg.includes('ORA-00001') || oracleError.includes('ORA-00001') ||
      responseMessage.includes('ORA-00001') ||
      errorMsg.includes('unique constraint') || oracleError.includes('unique constraint') ||
      errorMsg.includes('PK_SYSTEM_USERS') || oracleError.includes('SYSTEM_USERS_PK') ||
      (errorMsg.includes('USER_ID') && errorMsg.includes('already exists')) ||
      (errorMsg.includes('User already exists') || errorCode.includes('User already exists'))) {
      return errorCode || `User ID "${this.userForm.get('userId')?.value}" already exists. Please choose a different User ID.`;
    }

    // Check for initials field size error (ORA-12899)
    if ((errorMsg.includes('ORA-12899') || oracleError.includes('ORA-12899')) &&
      (errorMsg.includes('USER_INITIALS') || oracleError.includes('USER_INITIALS'))) {
      return 'Name Initials exceeds the maximum length of 3 characters.';
    }

    // Check for AD User ID field size error (ORA-12899)
    if ((errorMsg.includes('ORA-12899') || oracleError.includes('ORA-12899')) &&
      (errorMsg.includes('AD_USER_ID') || oracleError.includes('AD_USER_ID'))) {
      return 'AD User ID exceeds the maximum length of 20 characters.';
    }

    // Check for User Class field size error (ORA-12899)
    if ((errorMsg.includes('ORA-12899') || oracleError.includes('ORA-12899')) &&
      (errorMsg.includes('USER_CLASS') || oracleError.includes('USER_CLASS'))) {
      return 'User Class exceeds the maximum length of 5 characters.';
    }

    // Check for other field size errors
    if (errorMsg.includes('ORA-12899') || oracleError.includes('ORA-12899')) {
      const fieldMatch = (errorMsg + oracleError).match(/"([^"]+)"/);
      if (fieldMatch && fieldMatch[1]) {
        return `Field value is too large for database column: ${fieldMatch[1]}`;
      }
      return 'One or more field values exceed the maximum allowed length.';
    }

    // Check for termination date before effective date
    if (errorMsg.includes('termination') && errorMsg.includes('effective')) {
      return 'Termination Date cannot be before Effective Date.';
    }

    // Check for missing required chapter
    if (errorMsg.includes('chapter') || errorMsg.includes('CHAPTER')) {
      return 'Please assign at least one chapter before saving.';
    }

    // Check for invalid warehouse
    if (errorMsg.includes('warehouse') || errorMsg.includes('WAREHOUSE')) {
      return 'Invalid warehouse assignment. Please select a valid warehouse.';
    }

    // Return specific error message if available, otherwise generic
    if (errorDetails) {
      return errorDetails;
    }

    if (errorMsg && errorMsg !== 'Failed to create user') {
      return errorMsg;
    }

    // Default generic error
    return 'Error creating system user account. All changes reverted. Please check all fields and try again.';
  }

  // ============================================================================
  // FORM UTILITIES (for template)
  // ============================================================================

  getControl(controlName: string) {
    return this.userForm.get(controlName);
  }

  hasError(controlName: string, errorType: string): boolean {
    const control = this.userForm.get(controlName);
    return control ? control.hasError(errorType) && control.touched : false;
  }

  getSelectedGroupDescription(): string {
    const groupCode = this.userForm.get('groupCode')?.value;
    if (!groupCode) return '';

    const group = this.groups().find(g => g.groupId === groupCode);
    return group ? group.description : '';
  }

  /** Sanitize input on typing: no leading spaces, single space between words */
  sanitizeInput(controlName: string): void {
    const control = this.userForm.get(controlName);
    if (!control) return;
    const value = control.value;
    if (typeof value !== 'string') return;

    const sanitized = value.replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
    if (sanitized !== value) {
      control.setValue(sanitized, { emitEvent: false });
    }
  }

  /** Trim trailing spaces on blur */
  trimInput(controlName: string): void {
    const control = this.userForm.get(controlName);
    if (!control) return;
    const value = control.value;
    if (typeof value !== 'string') return;

    const trimmed = value.trimEnd();
    if (trimmed !== value) {
      control.setValue(trimmed, { emitEvent: false });
    }
  }

  // Filter input to allow only alphanumeric characters (letters and numbers)
  onAlphanumericInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const filteredValue = input.value.replace(/[^a-zA-Z0-9]/g, '');

    if (input.value !== filteredValue) {
      this.userForm.get(controlName)?.setValue(filteredValue);
      input.value = filteredValue;
    }
  }

  // Convert input to uppercase
  convertToUppercase(controlName: string): void {
    const control = this.userForm.get(controlName);
    if (!control) return;
    const value = control.value;
    if (typeof value !== 'string') return;

    const uppercased = value.toUpperCase();
    if (uppercased !== value) {
      control.setValue(uppercased, { emitEvent: false });
    }
  }

  /**
   * Handle effective date input using DateFieldUtility
   */
  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    DateFieldValidationUtility.handleStartDateInput(
      input.value,
      this.userForm.get('effectiveDate')
    );
  }

  /**
   * Handle effective date blur using DateFieldUtility
   */
  onEffectiveDateBlur(): void {
    const control = this.userForm.get('effectiveDate');
    if (control) {
      control.markAsTouched();
    }
  }

  /**
   * Handle termination date input using DateFieldUtility
   */
  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    DateFieldValidationUtility.handleEndDateInput(
      input.value,
      this.userForm.get('terminationDate'),
      false // isEditMode
    );
  }

  /**
   * Handle termination date blur using DateFieldUtility
   */
  onTerminationDateBlur(): void {
    const control = this.userForm.get('terminationDate');
    if (control) {
      control.markAsTouched();
    }
  }

  // Format date from ISO string or DD/MM/YYYY to DD-MMM-YYYY (uppercase) using DateFieldUtility
  formatDateForDisplay(dateStr: string): string {
    if (!dateStr) return '';

    // Parse and format using DateFieldUtility
    // Try parsing with DD/MM/YYYY format first, then fall back to other formats
    let momentDate = moment.utc(dateStr, 'DD/MM/YYYY', true);
    if (!momentDate.isValid()) {
      momentDate = moment.utc(dateStr);
    }

    if (momentDate.isValid()) {
      return DateFieldValidationUtility.formatDateForUI(momentDate).toUpperCase();
    }

    return dateStr; // Return original if invalid format
  }

  /**
   * Get error message for Effective Date using DateFieldUtility
   */
  getEffectiveDateError(): string {
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.userForm.get('effectiveDate'),
      'Effective Date',
      'Termination Date',
      this.userForm.errors
    );
  }

  /**
   * Get error message for Termination Date using DateFieldUtility
   */
  getTerminationDateError(): string {
    return DateFieldValidationUtility.getTerminationDateErrorMessage(
      this.userForm.get('terminationDate'),
      this.userForm.errors
    );
  }
}