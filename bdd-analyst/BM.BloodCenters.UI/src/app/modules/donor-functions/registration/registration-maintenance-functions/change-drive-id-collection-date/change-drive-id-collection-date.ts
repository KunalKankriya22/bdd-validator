import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, FormControl, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import moment, { Moment } from 'moment';

import { UppercaseMomentDateAdapter } from '@shared/date/uppercase-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { UnitIdFieldComponent, UnitValidationResponse, UnitIdPostValidateEvent } from '@shared/components/unit-id-field';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

import { ChangeDriveIdCollectionDateService } from './services/change-drive-id-collection-date.service';
import {
  DonationRecord,
  DriveOption,
  DonationTypeOption,
  ProcedureCodeOption,
  UpdateDriveRequest,
  RetrieveResponse
} from './models/change-drive-id-collection-date.model';

@Component({
  selector: 'app-change-drive-id-collection-date',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatPaginatorModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    UnitIdFieldComponent
  ],
  templateUrl: './change-drive-id-collection-date.html',
  styleUrls: ['./change-drive-id-collection-date.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ]
})
export class ChangeDriveIdCollectionDateComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly headerService = inject(HeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly changeDriveService = inject(ChangeDriveIdCollectionDateService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/' },
      { label: 'Change Drive ID or Collection Date', link: null }
    ],
    title: 'Change Drive ID or Collection Date',
    subtitle: '',
    actions: []
  };

  searchForm!: FormGroup;
  dataForm!: FormGroup;

  private readonly driveInputValue = signal('');
  selectedIdType = signal<'UNIT_ID' | 'DEFERRAL_ID'>('UNIT_ID');

  isLoading = signal(false);

  driveOptions = signal<DriveOption[]>([]);

  filteredDriveOptions = computed(() => {
    const search = this.driveInputValue().toLowerCase();
    const options = this.driveOptions();
    if (!search) return options;
    return options.filter(d =>
      (d.driveId || '').toLowerCase().includes(search) ||
      (d.sponsorName || '').toLowerCase().includes(search)
    );
  });
  donationTypeOptions = signal<DonationTypeOption[]>([]);
  procedureCodeOptions = signal<ProcedureCodeOption[]>([]);

  tableSearchText = signal('');

  tableSearchConfig: SearchBarConfig = {
    placeholder: 'Search by unit or deferral ID',
    minLength: 1,
    ariaLabel: 'Search donations table',
    searchOnEnterOnly: true,
    alwaysShowTooltip: false
  };

  pageSize = signal(25);
  pageIndex = signal(0);
  totalRecords = signal(0);
  pageSizeOptions = [10, 25, 50, 100];

  displayedDonations = signal<AbstractControl[]>([]);

  sortColumn = signal('unitDeferralId');
  sortDirection = signal<'asc' | 'desc'>('asc');

  minDate = signal<Moment | null>(null);
  get maxDate(): Moment {
    return this.chapterTimezoneService.getChapterLocalDate();
  }

  private validatedIds = new Set<string>();
  // Keyed by parsedUnitId (uppercased) so the lookup in onUnitValidated is stable even if the
  // user navigates to a different page while the API call is in-flight.
  private pendingDonationData = new Map<string, { donation: DonationRecord; parsedUnitId: string; actualIndex: number }>();

  get donationsArray(): FormArray {
    return this.dataForm.get('donations') as FormArray;
  }

  paginatedDonations = computed(() => {
    const donations = this.displayedDonations();
    const start = this.pageIndex() * this.pageSize();
    const end = start + this.pageSize();
    return donations.slice(start, end);
  });

  constructor() {
    this.initForms();

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
          actions: []
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadLookups();
    this.loadUpdteDrivParam();
    this.subscribeToChapterChanges();
    this.addNewUnit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    this.searchForm = this.fb.group({
      idType: ['UNIT_ID'],
      newDate: [null],
      newDrive: ['']
    });

    this.dataForm = this.fb.group({
      donations: this.fb.array([])
    });
  }

  private loadLookups(): void {
    forkJoin({
      donationTypes: this.changeDriveService.getDonationTypes(),
      procedureCodes: this.changeDriveService.getProcedureCodes()
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ donationTypes, procedureCodes }) => {
          this.donationTypeOptions.set(donationTypes);
          this.procedureCodeOptions.set(procedureCodes);
          this.cdr.markForCheck();
        },
        error: () => {
          this.showError('Failed to load lookup data. Please refresh and try again.');
        }
      });
  }

  private loadUpdteDrivParam(): void {
    this.changeDriveService.getUpdteDrivParam()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const days = response.data?.value ?? 30;
          const baseDate = this.chapterTimezoneService.isChapterLocalDateAvailable()
            ? this.chapterTimezoneService.getChapterLocalDate()
            : moment();
          this.minDate.set(baseDate.clone().subtract(days, 'days').startOf('day'));
          this.cdr.markForCheck();
        },
        error: () => {
          const baseDate = this.chapterTimezoneService.isChapterLocalDateAvailable()
            ? this.chapterTimezoneService.getChapterLocalDate()
            : moment();
          this.minDate.set(baseDate.clone().subtract(30, 'days').startOf('day'));
        }
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clear();
        this.loadLookups();
      });
  }

  onNewDateChange(): void {
    const newDate = this.searchForm.get('newDate')?.value;

    // Clear drive dropdown and input value
    this.searchForm.get('newDrive')?.setValue('');
    this.driveInputValue.set('');
    this.driveOptions.set([]);

    if (!newDate) {
      this.cdr.markForCheck();
      return;
    }

    // Load drives for the selected date
    const chapterId = this.headerService.getCurrentChapterId();
    if (!chapterId) {
      this.showError('Chapter ID is required');
      return;
    }

    const dateStr = DateFieldValidationUtility.serializeDateForApi(newDate);
    if (!dateStr) {
      this.showError('Invalid date format');
      return;
    }

    this.changeDriveService.getDrivesByDate(dateStr, chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Drives API Response:', response);
          const drives = response.data || [];
          console.log('Drives data:', drives);
          if (drives.length === 0) {
            this.showError('No drives found for the selected date.');
            this.driveOptions.set([]);
          } else {
            this.driveOptions.set(drives);
            console.log('driveOptions set to:', this.driveOptions());
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error fetching drives:', err);
          this.showError('Failed to load drives for the selected date.');
          this.driveOptions.set([]);
          this.cdr.markForCheck();
        }
      });
  }

  onIdTypeChange(): void {
    const newIdType = this.searchForm.get('idType')?.value;
    const previousIdType = this.selectedIdType();

    // Check if there's validated data (non-pending rows)
    const hasValidatedData = this.donationsArray.controls.some(c => !c.get('isPending')?.value);

    if (hasValidatedData && newIdType !== previousIdType) {
      // Show confirmation dialog
      const dialogData: ConfirmActionDialogData = {
        title: 'Are you sure you want to change ID type?',
        message: 'You have unsaved changes. Are you sure you want to change the ID type? Unsaved changes will be lost.',
        confirmText: 'DISCARD CHANGES',
        cancelText: 'STAY'
      };

      const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
        width: '450px',
        data: dialogData,
        disableClose: true
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result === true) {
          // User chose to discard changes
          this.performIdTypeChange(newIdType);
        } else {
          // User chose to stay - revert dropdown to previous value
          this.searchForm.get('idType')?.setValue(previousIdType, { emitEvent: false });
        }
        this.cdr.markForCheck();
      });
    } else {
      // No validated data, just perform the change
      this.performIdTypeChange(newIdType);
    }
  }

  private performIdTypeChange(idType: 'UNIT_ID' | 'DEFERRAL_ID'): void {
    this.selectedIdType.set(idType);

    // Clear existing data
    this.donationsArray.clear();
    this.validatedIds.clear();
    this.pendingDonationData.clear();
    this.driveOptions.set([]);
    this.driveInputValue.set('');
    this.tableSearchText.set('');
    this.totalRecords.set(0);
    this.displayedDonations.set([]);
    this.pageIndex.set(0);

    // Reset New Date and New Drive
    this.searchForm.get('newDate')?.reset();
    this.searchForm.get('newDrive')?.reset();

    // Add fresh pending row
    this.addNewUnit();
    this.cdr.markForCheck();
  }

  onNewDriveInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value || '';
    this.driveInputValue.set(value);
    this.cdr.markForCheck();
  }

  onNewDriveBlur(): void {
    const newDriveId = this.searchForm.get('newDrive')?.value?.trim().toUpperCase();
    if (newDriveId) {
      // Update the form value with uppercase
      this.searchForm.get('newDrive')?.setValue(newDriveId, { emitEvent: false });
      this.validateNewDrive(newDriveId);
    }
    this.cdr.markForCheck();
  }

  onDriveSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedDriveId = event.option.value;
    this.searchForm.get('newDrive')?.setValue(selectedDriveId);
    this.driveInputValue.set(selectedDriveId);
    this.validateNewDrive(selectedDriveId);
    this.cdr.markForCheck();
  }

  displayDriveFn = (driveId: string): string => {
    if (!driveId) return '';
    const found = this.driveOptions().find(d => d.driveId === driveId);
    return found ? driveId : driveId;
  };

  private validateNewDrive(newDriveId: string): void {
    if (!newDriveId) return;

    const validatedRows = this.donationsArray.controls.filter(c => !c.get('isPending')?.value);
    if (validatedRows.length > 0) {
      const currentDriveId = validatedRows[0].get('driveId')?.value;
      if (currentDriveId && newDriveId.toUpperCase() === currentDriveId.toUpperCase()) {
        this.showError('New drive cannot be the same as current drive.');
        this.searchForm.get('newDrive')?.setValue('');
        this.driveInputValue.set('');
      }
    }
  }

  private loadDrivesFromValidatedRows(): void {
    const validatedRows = this.donationsArray.controls.filter(c => !c.get('isPending')?.value);
    if (validatedRows.length === 0) return;

    const collDate = validatedRows[0].get('collectionDate')?.value;
    if (!collDate) return;

    const dateStr = moment.isMoment(collDate) ? collDate.format('YYYY-MM-DD') : moment(collDate).format('YYYY-MM-DD');
    const chapterId = this.headerService.getCurrentChapterId() || '';
    this.changeDriveService.getDrivesByDate(dateStr, chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.driveOptions.set(response.data || []);
          this.cdr.markForCheck();
        },
        error: () => {
          this.driveOptions.set([]);
          this.cdr.markForCheck();
        }
      });
  }

  addNewUnit(): void {
    const newGroup = this.fb.group({
      unitDeferralId: ['', [Validators.required, Validators.maxLength(15)]],
      collectionDate: [null],
      transactionId: [''],
      donationType: [''],
      procedureCode: [''],
      ac: ['N'],
      driveId: [''],
      originalData: [null],
      isPending: [true]
    });

    this.donationsArray.push(newGroup);
    this.totalRecords.update(v => v + 1);
    this.updateDisplayedDonations();
    this.cdr.markForCheck();
  }

  onUnitPostValidate(event: UnitIdPostValidateEvent, paginatedIndex: number): void {
    const displayed = this.paginatedDonations();
    const row = displayed[paginatedIndex];
    if (!row) { event.reject('Row not found'); return; }

    // Resolve actualIndex at post-validate time so the Map key is stable even if the
    // user navigates to a different page before the API returns and onUnitValidated fires.
    const actualIndex = this.donationsArray.controls.indexOf(row);
    const parsedUnitId = event.data.parsedUnitId!;

    if (this.validatedIds.has(parsedUnitId.toUpperCase())) {
      event.reject('This Unit/Deferral ID has already been added.');
      return;
    }

    const chapterId = this.headerService.getCurrentChapterId() || '';
    const idType = this.selectedIdType();

    if (idType === 'UNIT_ID') {
      // Only call Unit API - reject if not found
      this.changeDriveService.getByUnitId(parsedUnitId, chapterId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: RetrieveResponse) => {
            if (response.success && response.data && response.data.length > 0) {
              this.pendingDonationData.set(parsedUnitId.toUpperCase(), { donation: response.data[0], parsedUnitId, actualIndex });
              event.confirm();
            } else {
              event.reject('Unit ID not found.');
            }
          },
          error: () => event.reject('Unit ID not found.')
        });
    } else {
      // DEFERRAL_ID - only call Deferral API
      this.changeDriveService.getByDeferralId(parsedUnitId, chapterId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: RetrieveResponse) => {
            if (response.success && response.data && response.data.length > 0) {
              this.pendingDonationData.set(parsedUnitId.toUpperCase(), { donation: response.data[0], parsedUnitId, actualIndex });
              event.confirm();
            } else {
              event.reject('Deferral ID not found.');
            }
          },
          error: () => event.reject('Deferral ID not found.')
        });
    }
  }

  onUnitValidated(_data: UnitValidationResponse, _paginatedIndex: number): void {
    const key = _data.parsedUnitId?.toUpperCase();
    if (!key) return;

    const pending = this.pendingDonationData.get(key);
    if (!pending) return;

    this.populateRow(pending.actualIndex, pending.donation, pending.parsedUnitId);
    this.pendingDonationData.delete(key);
  }

  private populateRow(actualIndex: number, donation: DonationRecord, inputValue: string): void {
    const row = this.donationsArray.at(actualIndex);
    row.patchValue({
      unitDeferralId: donation.unitId || donation.deferralId || inputValue,
      collectionDate: donation.collectionDate ? moment(donation.collectionDate) : null,
      transactionId: donation.transactionId,
      donationType: (donation.donationType || '').toUpperCase().trim(),
      procedureCode: (donation.procedureCode || '').toUpperCase().trim(),
      ac: (donation.auditFlag || 'N').toUpperCase(),
      driveId: donation.driveId,
      originalData: donation,
      isPending: false
    });
    this.validatedIds.add(inputValue.toUpperCase());
    this.updateDisplayedDonations();
    this.loadDrivesForDonation(donation);
    this.cdr.markForCheck();
  }

  private loadDrivesForDonation(donation: DonationRecord): void {
    const dateStr = donation.collectionDate
      ? moment(donation.collectionDate).format('YYYY-MM-DD')
      : null;
    if (!dateStr) return;

    // Call API for each validated unit/deferral ID and merge drives into dropdown
    const chapterId = this.headerService.getCurrentChapterId() || '';
    this.changeDriveService.getDrivesByDate(dateStr, chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const newDrives = response.data || [];
          const existingDrives = this.driveOptions();

          // Merge new drives with existing ones, avoiding duplicates by driveId
          const existingDriveIds = new Set(existingDrives.map(d => d.driveId));
          const uniqueNewDrives = newDrives.filter(d => !existingDriveIds.has(d.driveId));

          this.driveOptions.set([...existingDrives, ...uniqueNewDrives]);
          this.cdr.markForCheck();
        },
        error: () => {
          // On error, keep existing drives
          this.cdr.markForCheck();
        }
      });
  }

  private createDonationFormGroup(donation: DonationRecord): FormGroup {
    return this.fb.group({
      unitDeferralId: [donation.unitId || donation.deferralId],
      collectionDate: [donation.collectionDate ? moment(donation.collectionDate) : null],
      transactionId: [donation.transactionId],
      donationType: [(donation.donationType || '').toUpperCase().trim()],
      procedureCode: [(donation.procedureCode || '').toUpperCase().trim()],
      ac: [(donation.auditFlag || 'N').toUpperCase()],
      driveId: [donation.driveId],
      originalData: [donation]
    });
  }

  private updateDisplayedDonations(): void {
    const searchText = this.tableSearchText().toLowerCase();
    let filtered = [...this.donationsArray.controls];
    if (searchText) {
      filtered = filtered.filter(control => {
        const unitDeferralId = (control.get('unitDeferralId')?.value || '').toLowerCase();
        return unitDeferralId.includes(searchText);
      });
    }

    const col = this.sortColumn();
    const dir = this.sortDirection();
    filtered.sort((a, b) => {
      const isPendingA = a.get('isPending')?.value;
      const isPendingB = b.get('isPending')?.value;
      if (isPendingA && !isPendingB) return 1;
      if (!isPendingA && isPendingB) return -1;
      if (isPendingA && isPendingB) return 0;

      const valA = (a.get(col)?.value || '').toString().toLowerCase();
      const valB = (b.get(col)?.value || '').toString().toLowerCase();
      const cmp = valA.localeCompare(valB);
      return dir === 'asc' ? cmp : -cmp;
    });

    this.displayedDonations.set(filtered);
  }

  toggleSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.updateDisplayedDonations();
    this.cdr.markForCheck();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn() !== column) return 'unfold_more';
    return this.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  onTableSearch(searchText: string): void {
    this.tableSearchText.set(searchText);
    this.pageIndex.set(0);
    this.updateDisplayedDonations();
  }

  onTableSearchCleared(): void {
    this.tableSearchText.set('');
    this.pageIndex.set(0);
    this.updateDisplayedDonations();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  deleteRow(index: number): void {
    const displayed = this.paginatedDonations();
    const control = displayed[index];
    if (!control) return;
    const actualIndex = this.donationsArray.controls.indexOf(control);
    if (actualIndex === -1) return;
    const unitDeferralId = control.get('unitDeferralId')?.value;
    if (unitDeferralId && !control.get('isPending')?.value) {
      this.validatedIds.delete(unitDeferralId.toUpperCase());
    }
    this.donationsArray.removeAt(actualIndex);
    this.totalRecords.update(v => Math.max(0, v - 1));
    this.updateDisplayedDonations();
    this.cdr.markForCheck();
  }

  onCancel(): void {
    this.clear();
  }

  clear(): void {
    this.searchForm.get('newDate')?.enable();
    this.searchForm.get('newDrive')?.enable();
    this.searchForm.reset();
    this.dataForm.reset();
    this.donationsArray.clear();
    this.validatedIds.clear();
    this.pendingDonationData.clear();
    this.driveOptions.set([]);
    this.driveInputValue.set('');
    this.tableSearchText.set('');
    this.pageIndex.set(0);
    this.totalRecords.set(0);
    this.displayedDonations.set([]);
    this.addNewUnit();
    this.cdr.markForCheck();
  }

  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.searchForm.controls)
      .find(key => this.searchForm.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      if (el) {
        el.focus();
        return;
      }
    }
    // Fallback: focus the New Date field when neither date nor drive is provided
    const newDateInput = document.querySelector('[formControlName="newDate"]') as HTMLElement;
    if (newDateInput) {
      newDateInput.focus();
    }
  }

  onSave(): void {
    const { newDate, newDrive } = this.searchForm.getRawValue();

    if (!newDate && !newDrive) {
      this.showError('Please provide New Date or New Drive to update.');
      this.focusFirstInvalidField();
      return;
    }

    const transactionIds: string[] = [];
    const unitIds: string[] = [];
    this.donationsArray.controls.forEach(control => {
      if (!control.get('isPending')?.value) {
        const transactionId = control.get('transactionId')?.value;
        const unitId = control.get('unitDeferralId')?.value;
        if (transactionId) {
          transactionIds.push(transactionId);
          if (unitId) unitIds.push(unitId);
        }
      }
    });

    if (transactionIds.length === 0) {
      this.showError('No items to update.');
      return;
    }

    const serializedDate = newDate ? DateFieldValidationUtility.serializeDateForApi(newDate) : undefined;

    const request: UpdateDriveRequest = {
      newCollectionDate: serializedDate ?? undefined,
      newDriveId: newDrive || undefined,
      transactionIds
    };

    this.isLoading.set(true);
    this.changeDriveService.updateDrive(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (_response) => {
          this.isLoading.set(false);
          const message = unitIds.length === 1
            ? `Drive ID for unit ${unitIds[0]} has been updated successfully.`
            : `Drive ID for ${unitIds.length} units has been updated successfully.`;
          this.showSuccess(message);
          this.clear();
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isLoading.set(false);
          this.showErrorResponse(error?.error);
          this.cdr.markForCheck();
        }
      });
  }

  formatDate(value: Moment | string | null): string {
    if (!value) return '-';
    const m = moment.isMoment(value) ? value : moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private showErrorResponse(response: any): void {
    const errorResponse = response?.errorResponse;
    const errorCode = response?.errorCode || errorResponse?.errorCode || '';
    const errorMessage = errorResponse?.error || response?.message || 'An error occurred while saving';
    const displayMsg = errorCode ? `Error: ${errorCode}: ${errorMessage}` : errorMessage;

    this.snackBar.open(displayMsg, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
