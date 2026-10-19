import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import {
  noWhitespaceOnlyValidator,
  trimControlValue,
  codeFieldValidator
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
import { forkJoin, of, Subject, takeUntil } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
  ChapterAssignment,
  UserDetailsResponse,
  UserChapterDetail
} from '../models/service.model';
import { UserApiService } from '../services/user.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import moment from 'moment';

@Component({
  selector: 'app-edit-user',
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
  templateUrl: './edit-user.html',
  styleUrls: ['./edit-user.scss']
})
export class EditUserComponent implements OnInit, OnDestroy {
  private readonly headerService = inject(HeaderService);
  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  private getChapterMinDate(): moment.Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  // Route params
  editUserId: string = '';

  // Page header configuration
  headerConfig: PageHeaderConfig | null = null;

  // Form
  userForm: FormGroup;
  isSubmitting = signal(false);
  isLoadingUser = signal(true);

  // Navigation
  activeSection = signal<SectionId>('personal-info');

  // Table configurations
  displayedColumns = WAREHOUSE_TABLE_COLUMNS;
  chaptersDisplayedColumns = CHAPTER_TABLE_COLUMNS;

  // Data sources
  warehouseDataSource: Warehouse[] = [];
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

  minDate: any; // Initialized in constructor with chapter's local date

  get minTerminationDate(): any {
    const effectiveDate = this.userForm.get('effectiveDate')?.value;
    if (!effectiveDate) return this.minDate;
    const chapterToday = this.getChapterMinDate();

    // Use DateFieldUtility to serialize dates for comparison
    const effStr = DateFieldValidationUtility.serializeDateForApi(effectiveDate) || '';
    const todayStr = DateFieldValidationUtility.serializeDateForApi(chapterToday) || '';

    return effStr > todayStr ? effectiveDate : chapterToday;
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private scrollHandler: ScrollHandlerService,
    private userApiService: UserApiService,
    private snackBar: MatSnackBar,
    private dateAdapter: DateAdapter<any>
  ) {
    this.minDate = this.getChapterMinDate();

    this.userForm = this.fb.group({
      userId: [{ value: '', disabled: true }],
      firstName: ['', [Validators.required, Validators.maxLength(25), noWhitespaceOnlyValidator()]],
      lastName: ['', [Validators.required, Validators.maxLength(30), noWhitespaceOnlyValidator()]],
      nameInitials: ['', [Validators.maxLength(3), noWhitespaceOnlyValidator()]],
      userClass: ['', [Validators.maxLength(5), noWhitespaceOnlyValidator()]],
      email: ['', [Validators.required, Validators.email]],
      staffNumber: ['', [Validators.required, Validators.maxLength(6), Validators.pattern(/^[a-zA-Z0-9]*$/), noWhitespaceOnlyValidator()]],
      adUserId: ['', [Validators.pattern(/^[a-zA-Z0-9]*$/), Validators.maxLength(20), noWhitespaceOnlyValidator()]],
      labCode: [''],
      labDescription: [{ value: '', disabled: true }],
      qcUserId: ['', [Validators.maxLength(10), Validators.pattern(/^[a-zA-Z0-9]*$/), noWhitespaceOnlyValidator()]],
      printerId: [''],
      printerDescription: [{ value: '', disabled: true }],
      effectiveDate: ['', [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator(this.chapterOffset)]],
      terminationDate: ['', [DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)]],
      assignedWarehouse: ['', Validators.required],
      groupCode: ['', Validators.required],
      groupDescription: [{ value: '', disabled: true }],
      accessLevel: ['', Validators.required]
    });

    this.setupLabCodeWatcher();
    this.setupPrinterCodeWatcher();
    this.setupGroupCodeWatcher();
    this.setupDateValidation();
    this.setupDateFormatting();
  }

  ngOnInit(): void {
    this.dateAdapter.setLocale('en-US');

    // ChapterAwareDateAdapter automatically uses chapter timezone via HeaderService
    this.scrollHandler.initialize();

    this.scrollHandler.getActiveSection().subscribe(section => {
      this.activeSection.set(section);
    });

    // Get userId from route params
    this.editUserId = this.route.snapshot.paramMap.get('userId') || '';

    if (!this.editUserId) {
      this.showError('No user ID provided');
      this.router.navigateByUrl('/system-administration/user-admin/manage-users');
      return;
    }

    this.loadLookupDataAndUser();

    // Subscribe to chapter changes
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.scrollHandler.cleanup();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to chapter changes to navigate back to list
   * Following the pattern from donor-access-class.ts
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Navigate back to manage users list when chapter changes
        this.router.navigateByUrl('/system-administration/user-admin/manage-users');
      });
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  private loadLookupDataAndUser(): void {
    this.isLoadingUser.set(true);

    // Load lookups, user data, chapters, and group details in parallel
    const chapterId = this.headerService.getCurrentChapterId();
    forkJoin({
      chapterLookups: this.userApiService.getChapters(chapterId),
      warehouses: this.userApiService.getWarehouses(chapterId),
      labCodes: this.userApiService.getLabCodes(chapterId),
      printerCodes: this.userApiService.getPrinterCodes(),
      groups: this.userApiService.getGroups(),
      accessLevels: this.userApiService.getAccessLevels().pipe(catchError(() => of([]))),
      user: this.userApiService.getUser(this.editUserId),
      userChapters: this.userApiService.getUserChapters(this.editUserId).pipe(catchError(() => of([]))),
      groupDetails: this.userApiService.getUserGroupDetails(this.editUserId).pipe(catchError(() => of(null)))
    }).subscribe({
      next: (data) => {
        this.chapters.set(data.chapterLookups);
        this.warehouses.set(data.warehouses);
        this.filteredWarehouses = data.warehouses;
        this.labCodes.set(data.labCodes);
        this.filteredLabCodes = data.labCodes;
        this.printerCodes.set(data.printerCodes);
        this.filteredPrinterCodes = data.printerCodes;
        this.groups.set(data.groups);
        this.filteredGroups = data.groups;
        this.accessLevels.set(data.accessLevels);
        this.filteredAccessLevels = data.accessLevels;
        this.populateFormWithUserData(data.user);
        this.populateChapters(data.userChapters);
        this.populateGroupDetails(data.groupDetails);
        this.setupSearchControls();
        this.isLoadingUser.set(false);
      },
      error: () => {
        this.isLoadingUser.set(false);
        this.showError('Failed to load user data. Please try again.');
      }
    });
  }

  private populateFormWithUserData(user: UserDetailsResponse): void {
    // Build header config with user's name as title
    const fullName = `${user.userFirstName || ''} ${user.userLastName || ''}`.trim();
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'Manage Users', link: '/system-administration/user-admin/manage-users' }
      ],
      title: fullName || 'Edit User',
      showBackButton: true,
      onBackClick: () => this.onBack()
    };

    // Disable effective date field first (before setting value to avoid date adapter interference)
    this.userForm.get('effectiveDate')?.disable();

    // Patch form values
    this.userForm.patchValue({
      userId: user.userId?.trim() || '',
      firstName: user.userFirstName?.trim() || '',
      lastName: user.userLastName?.trim() || '',
      nameInitials: user.userInitials?.trim() || '',
      userClass: user.userClass?.trim() || '',
      email: user.userEmail?.trim() || '',
      staffNumber: user.staffNo?.trim() || '',
      adUserId: user.adUserId?.trim() || '',
      labCode: user.labCode?.trim() || '',
      qcUserId: user.ktUserId?.trim() || '',
      printerId: user.printerId?.trim() || '',
      printerDescription: user.printerDescription?.trim() || '',
      assignedWarehouse: user.warehouseId?.trim() || '',
      terminationDate: user.terminationDate ? moment(user.terminationDate) : ''
    });

    // Set effective date with uppercase formatting (after disabling to avoid date adapter formatting)
    if (user.effectiveDate) {
      const uppercaseDate = DateFieldValidationUtility.formatDateForUI(moment(user.effectiveDate)).toUpperCase();
      this.userForm.get('effectiveDate')?.setValue(uppercaseDate);
    }

  }

  private populateChapters(userChapters: UserChapterDetail[]): void {
    if (!userChapters || userChapters.length === 0) return;

    this.chaptersDataSource = userChapters.map(ch => ({
      chapterId: ch.chapterId?.trim() || '',
      chapterName: ch.chapterName?.trim() || '',
      effectiveDate: this.convertApiDateToDisplayFormat(ch.effectiveDate) || '',
      terminationDate: this.convertApiDateToDisplayFormat(ch.terminationDate) || '',
      status: getChapterStatus(
        ch.effectiveDate,
        ch.terminationDate || null,
        this.chapterOffset
      ),
      isDefault: ch.defaultFlag?.trim()?.toUpperCase() === 'Y'
    }));

    this.filteredChaptersDataSource = [...this.chaptersDataSource];
  }

  private populateGroupDetails(groupDetails: any): void {
    if (!groupDetails) return;

    // groupDetails may be a ReturnResult wrapper or direct object
    const details = groupDetails.item || groupDetails;
    if (details && details.groupId) {
      this.userForm.patchValue({
        groupCode: details.groupId || '',
        accessLevel: details.accessLevel ?? ''
      });
    }
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
  // SEARCH & SORTING
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

  toggleChapterSort(column: 'chapterId' | 'chapterName'): void {
    if (this.chapterSortColumn === column) {
      this.chapterSortDirection = this.chapterSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
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
  // NAVIGATION
  // ============================================================================

  scrollToSection(sectionId: SectionId): void {
    this.scrollHandler.scrollToSection(sectionId);
  }

  onBack(): void {
    this.router.navigateByUrl('/system-administration/user-admin/manage-users');
  }

  onViewAssignedWarehouses(): void {
    this.router.navigate(['/system-administration/user-admin/user-warehouse'], {
      queryParams: { userId: this.editUserId }
    });
  }

  // ============================================================================
  // FORM ACTIONS
  // ============================================================================

  onCancel(): void { this.onBack(); }

  onClearAll(): void {
    const userId = this.userForm.get('userId')?.value;
    const effectiveDate = this.userForm.get('effectiveDate')?.value;

    // Reset form but preserve userId and effectiveDate (readonly field)
    this.userForm.reset();
    this.userForm.patchValue({ userId, effectiveDate });

    // Re-disable effectiveDate field (reset() will re-enable it)
    this.userForm.get('effectiveDate')?.disable();

    // Clear chapters and search
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

    this.userApiService.updateUser(this.editUserId, request).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        const successMessage = response.message || `User ${this.editUserId} updated successfully!`;
        this.showSuccess(successMessage);
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
  // CHAPTER METHODS
  // ============================================================================

  onAssignChapter(): void {
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
      position: { right: '0' },
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
    if (chapter.isDefault) {
      chapter.isDefault = false;
    } else {
      this.chaptersDataSource.forEach(c => {
        c.isDefault = c === chapter;
      });
    }
    this.chaptersDataSource = [...this.chaptersDataSource];
    this.filteredChaptersDataSource = [...this.filteredChaptersDataSource];
    this.userForm.markAsDirty();
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
      this.userForm.markAsDirty();

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
    this.userForm.markAsDirty();

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
      this.onChapterSearch();
      this.userForm.markAsDirty();
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
    const errorResponseError = error?.error?.errorResponse?.error || '';
    const errorCode = error?.error?.errorCode || '';
    const errorField = error?.error?.error || '';
    const errorMsg = error?.message || error?.error?.message || error?.error?.Message || '';
    const errorDetails = error?.error?.Error?.ErrorMessage || error?.error?.error?.ErrorMessage || '';
    const oracleError = error?.error?.errorMessage || '';
    const responseMessage = error?.error?.message || '';
    const nestedErrorMessage = error?.error?.error?.errorMessage || '';

    // Priority 1: Check for top-level message in response body (most user-friendly)
    if (responseMessage && responseMessage !== 'Failed to update user') {
      return responseMessage;
    }

    // Priority 2: Check for nested error message
    if (nestedErrorMessage) {
      return nestedErrorMessage;
    }

    // Priority 3: Check for errorResponse.error (from standardized API response)
    if (errorResponseError) return errorResponseError;

    // Priority 4: Check error field - only if it's a string, not an object
    if (errorField && typeof errorField === 'string') return errorField;

    if (errorDetails) return errorDetails;
    if (errorMsg && errorMsg !== 'Failed to update user') return errorMsg;
    return 'Error updating system user account. Please check all fields and try again.';
  }

  // ============================================================================
  // FORM UTILITIES
  // ============================================================================

  getControl(controlName: string) {
    return this.userForm.get(controlName);
  }

  hasError(controlName: string, errorType: string): boolean {
    const control = this.userForm.get(controlName);
    return control ? control.hasError(errorType) && control.touched : false;
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

  onAlphanumericInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const filteredValue = input.value.replace(/[^a-zA-Z0-9]/g, '');
    if (input.value !== filteredValue) {
      this.userForm.get(controlName)?.setValue(filteredValue);
      input.value = filteredValue;
    }
  }

  /**
   * Convert API date format to DD-MMM-YYYY format using DateFieldUtility
   * API returns: "2026-04-15T00:00:00" or "2026-04-15"
   * Output: "15-APR-2026"
   */
  private convertApiDateToDisplayFormat(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    return DateFieldValidationUtility.formatDateForUI(moment(dateStr)).toUpperCase();
  }

  /**
   * Handle termination date input using DateFieldUtility
   */
  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    DateFieldValidationUtility.handleEndDateInput(
      input.value,
      this.userForm.get('terminationDate'),
      true // isEditMode
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

  /**
   * Format date for display using DateFieldUtility
   */
  formatDateForDisplay(dateStr: string): string {
    if (!dateStr) return '';
    return DateFieldValidationUtility.formatDateForUI(moment(dateStr)).toUpperCase();
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
