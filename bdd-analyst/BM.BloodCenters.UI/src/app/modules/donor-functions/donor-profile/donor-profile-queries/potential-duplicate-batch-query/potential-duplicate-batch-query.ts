import { Component, OnInit, OnDestroy, signal, effect, inject, computed, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableColumn } from '@shared/interfaces/data-table.interface';

import { PotentialDuplicateBatchQueryApiService } from './services/potential-duplicate-batch-query-api.service';
import { CheckDonorPanel } from './components/check-donor-panel/check-donor-panel';
import { DonorWithinTestDialogComponent } from '../../../donor-within-test/donor-within-test-dialog.component';
import { DonorInterdictionsContentComponent } from '../../donor-interdictions/donor-interdictions-content.component';
import { DonorDemographicsComponent } from '../../../donor-demographics/donor-demographics';
import { DonorAttributesComponent } from '../../donor-profile-maintenance/donor-attributes/donor-attributes.component';
import {
  PotentialDuplicateBatch,
  DuplicateDonor,
  BatchDetails,
  DuplicateDonorRow,
  CheckSection,
  LastNameOption,
  MatchFlags,
  BATCH_STATUS_OPTIONS,
  PDMQ_ERROR_MESSAGES,
  EMPTY_MATCH_FLAGS
} from './models/potential-duplicate-batch-query.model';

@Component({
  selector: 'app-potential-duplicate-batch-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatInputModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    CheckDonorPanel,
    DonorWithinTestDialogComponent,
    DonorInterdictionsContentComponent,
    DonorDemographicsComponent,
    DonorAttributesComponent
  ],
  templateUrl: './potential-duplicate-batch-query.html',
  styleUrls: ['./potential-duplicate-batch-query.scss']
})
export class PotentialDuplicateBatchQuery implements OnInit, OnDestroy, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(PotentialDuplicateBatchQueryApiService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);

  private destroy$ = new Subject<void>();

  @ViewChild('donorIdCellTemplate', { static: true }) donorIdCellTemplate!: TemplateRef<unknown>;
  @ViewChild('diffCellDonorName', { static: true }) diffCellDonorName!: TemplateRef<unknown>;
  @ViewChild('diffCellSsn', { static: true }) diffCellSsn!: TemplateRef<unknown>;
  @ViewChild('diffCellDob', { static: true }) diffCellDob!: TemplateRef<unknown>;
  @ViewChild('diffCellSex', { static: true }) diffCellSex!: TemplateRef<unknown>;
  @ViewChild('diffCellWorkNumber', { static: true }) diffCellWorkNumber!: TemplateRef<unknown>;
  @ViewChild('diffCellHomeNumber', { static: true }) diffCellHomeNumber!: TemplateRef<unknown>;
  @ViewChild('diffCellMobileNumber', { static: true }) diffCellMobileNumber!: TemplateRef<unknown>;
  @ViewChild('diffCellAddress', { static: true }) diffCellAddress!: TemplateRef<unknown>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' }
    ],
    title: '',
    subtitle: ''
  };

  filterForm!: FormGroup;

  batches = signal<PotentialDuplicateBatch[]>([]);
  filteredBatches: PotentialDuplicateBatch[] = [];
  batchSearchControl = new FormControl('');

  lastNameOptions = signal<LastNameOption[]>([]);
  filteredLastNameOptions: LastNameOption[] = [];
  lastNameSearchControl = new FormControl('');

  readonly batchStatusOptions = BATCH_STATUS_OPTIONS;
  filteredBatchStatusOptions = [...BATCH_STATUS_OPTIONS];
  batchStatusSearchControl = new FormControl('');

  batchDetails = signal<BatchDetails | null>(null);
  donors = signal<DuplicateDonor[]>([]);

  // Merge statuses for editing
  mergeStatusOptions = signal<Array<{ code: string; description: string }>>([]);

  tableData = computed<DuplicateDonorRow[]>(() => {
    const allDonors = this.donors();
    // Backend API already handles lastName filtering via query parameter
    // Client-side filtering removed to show ALL donors in the set, including name variations
    const filtered = allDonors;

    const primary = filtered[0];

    return filtered.map(donor => {
      const isPrimary = donor.donorId === primary?.donorId;
      const donorName = donor.name || '';
      const ssn = donor.ssn || '-';
      const dateOfBirth = this.formatDate(donor.dateOfBirth);
      const sex = this.displaySex(donor.sex);
      const workNumber = donor.workPhone || '-';
      const homeNumber = donor.homePhone || '-';
      const mobileNumber = donor.mobilePhone || '-';
      const address = donor.address || '-';

      return {
        mergeFlag: donor.mergeFlag,
        donorId: donor.donorId,
        donorName,
        ssn,
        dateOfBirth,
        sex,
        workNumber,
        homeNumber,
        mobileNumber,
        address,
        matchFlags: donor.matchFlags || { ...EMPTY_MATCH_FLAGS },
        highlightDonorName: !isPrimary && donorName !== (primary?.name || ''),
        highlightSsn: !isPrimary && ssn !== (primary?.ssn || '-'),
        highlightDob: !isPrimary && dateOfBirth !== this.formatDate(primary?.dateOfBirth),
        highlightSex: !isPrimary && sex !== this.displaySex(primary?.sex),
        highlightWorkNumber: !isPrimary && workNumber !== (primary?.workPhone || '-'),
        highlightHomeNumber: !isPrimary && homeNumber !== (primary?.homePhone || '-'),
        highlightMobileNumber: !isPrimary && mobileNumber !== (primary?.mobilePhone || '-'),
        highlightAddress: !isPrimary && address !== (primary?.address || '-')
      };
    });
  });

  selectedDonor = signal<DuplicateDonorRow | null>(null);

  isLoading = signal<boolean>(false);
  isLoadingBatches = signal<boolean>(false);
  hasRetrieved = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  isCommitting = signal<boolean>(false);
  sidePanelOpen = signal<boolean>(false);
  sidePanelWidth = signal<string>('70vw');
  currentCheckDonorId = signal<string>('');
  currentCheckDonorName = signal<string>('');
  currentSection = signal<CheckSection | null>(null);

  tableConfig: DataTableConfig<DuplicateDonorRow> = {
    columns: [],
    stickyHeader: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Please enter search criteria to view results'
  };

  get foundOnDisplay(): string {
    const batch = this.batches().find(b => b.batchId === this.filterForm?.get('batchId')?.value);
    if (!batch?.foundOn) return '--';
    return this.formatDateTime(batch.foundOn);
  }

  constructor() {
    this.initForm();

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
          subtitle: pageData.subtitle || 'Review possible donor matches and select the appropriate action based on your investigation.'
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadBatches();
    this.loadLastNames();
    this.subscribeToChapterChanges();
    this.subscribeToFormChanges();
    this.setupSearchFilters();
  }

  ngAfterViewInit(): void {
    this.initTableConfig();
  }

  private initTableConfig(): void {
    const columns: TableColumn<DuplicateDonorRow>[] = [
      { key: 'mergeFlag', header: 'Merge Flag', width: '110px' },
      { key: 'donorId', header: 'Donor ID', width: '150px', cellTemplate: this.donorIdCellTemplate },
      { key: 'donorName', header: 'Donor Name', width: '160px', cellTemplate: this.diffCellDonorName },
      { key: 'ssn', header: 'SSN', width: '120px', cellTemplate: this.diffCellSsn },
      { key: 'dateOfBirth', header: 'Date of Birth', width: '130px', cellTemplate: this.diffCellDob },
      { key: 'sex', header: 'Sex', width: '80px', cellTemplate: this.diffCellSex },
      { key: 'workNumber', header: 'Work Number', width: '140px', cellTemplate: this.diffCellWorkNumber },
      { key: 'homeNumber', header: 'Home Number', width: '140px', cellTemplate: this.diffCellHomeNumber },
      { key: 'mobileNumber', header: 'Mobile Number', width: '140px', cellTemplate: this.diffCellMobileNumber },
      { key: 'address', header: 'Address', minWidth: '200px', truncate: true, cellTemplate: this.diffCellAddress }
    ];

    this.tableConfig = {
      ...this.tableConfig,
      columns
    };
  }

  private setupSearchFilters(): void {
    this.batchSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredBatches = this.batches().filter(batch =>
          batch.batchId.toLowerCase().includes(term)
        );
      });

    this.batchStatusSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredBatchStatusOptions = BATCH_STATUS_OPTIONS.filter(status =>
          status.label.toLowerCase().includes(term)
        );
      });

    this.lastNameSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredLastNameOptions = this.lastNameOptions().filter(option =>
          option.lastName.toLowerCase().includes(term)
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      batchId: [''],
      batchStatus: ['PENDG'],
      lastName: ['']
    });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetComponent();
        this.loadBatches();
        this.loadLastNames();
      });
  }

  private subscribeToFormChanges(): void {
    this.filterForm.get('batchStatus')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadBatches();
        this.loadLastNames();
        this.filterForm.patchValue({ batchId: '', lastName: '' }, { emitEvent: false });
      });
  }

  private loadBatches(): void {
    const status = this.filterForm.get('batchStatus')?.value;

    this.isLoadingBatches.set(true);

    this.apiService.getBatches(status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (batches) => {
          this.batches.set(batches);
          this.filteredBatches = [...batches];
          this.isLoadingBatches.set(false);
        },
        error: () => {
          this.batches.set([]);
          this.filteredBatches = [];
          this.isLoadingBatches.set(false);
        }
      });
  }

  onRetrieve(): void {
    const batchId = this.filterForm.get('batchId')?.value;
    const lastName = this.filterForm.get('lastName')?.value;

    if (!batchId && !lastName) {
      this.snackbarService.showError(PDMQ_ERROR_MESSAGES.NO_FILTER_SELECTED);
      return;
    }

    this.loadBatchDetails();
  }

  private loadBatchDetails(): void {
    const batchId = this.filterForm.get('batchId')?.value;
    if (!batchId) {
      return;
    }

    this.isLoading.set(true);
    this.hasRetrieved.set(true);
    this.selectedDonor.set(null);

    this.apiService.getBatchDetails(batchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          this.batchDetails.set(details);
          this.donors.set(details.donors || []);
          this.isLoading.set(false);

          // If batch is already resolved, show info message
          if (details.batch.status === 'RESOL') {
            this.snackbarService.showInfo('This batch has already been resolved and is read-only');
          }

          if (!details.donors || details.donors.length === 0) {
            this.snackbarService.showError(PDMQ_ERROR_MESSAGES.NO_DUPLICATES);
          } else {
            const rows = this.tableData();
            if (rows.length > 0) {
              this.selectedDonor.set(rows[0]);
            }
          }
        },
        error: (err) => {
          this.batchDetails.set(null);
          this.donors.set([]);
          this.isLoading.set(false);

          const msg = err?.displayMessage || PDMQ_ERROR_MESSAGES.LOAD_ERROR;
          if (err?.status === 404) {
            this.snackbarService.showError(PDMQ_ERROR_MESSAGES.BATCH_NOT_FOUND);
          } else {
            this.snackbarService.showError(msg);
          }
        }
      });
  }

  private loadLastNames(): void {
    const status = this.filterForm.get('batchStatus')?.value;

    this.apiService.getLastNames(undefined, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lastNames) => {
          this.lastNameOptions.set(lastNames);
          this.filteredLastNameOptions = [...lastNames];
        },
        error: () => {
          this.lastNameOptions.set([]);
          this.filteredLastNameOptions = [];
        }
      });
  }

  onLastNameSelected(event: MatSelectChange): void {
    const selectedLastName = event.value;
    const option = this.lastNameOptions().find(o => o.lastName === selectedLastName);
    if (option?.setId) {
      this.filterForm.patchValue({ batchId: option.setId }, { emitEvent: false });
    }
  }

  onRowClicked(row: DuplicateDonorRow): void {
    this.selectedDonor.set(row);
  }

  onOpenInvestigation(section: CheckSection): void {
    const donor = this.selectedDonor() || (this.tableData().length > 0 ? this.tableData()[0] : null);
    if (donor) {
      this.currentCheckDonorId.set(donor.donorId);
      this.currentCheckDonorName.set(donor.donorName);
      this.currentSection.set(section);
      this.sidePanelOpen.set(true);
    }
  }

  onViewDonations(): void {
    this.onOpenInvestigation('donations');
  }

  getSelectedDonorField(field: string): string {
    const donor = this.donors().find(d => d.donorId === this.currentCheckDonorId());
    if (!donor) return '';
    switch (field) {
      case 'dateOfBirth': return this.formatDate(donor.dateOfBirth);
      case 'sex': return this.displaySex(donor.sex);
      case 'abo': return (donor as any).abo || (donor as any).bloodType || '';
      default: return '';
    }
  }

  onPanelClose(): void {
    this.sidePanelOpen.set(false);
    this.sidePanelWidth.set('70vw');
    this.currentCheckDonorId.set('');
    this.currentCheckDonorName.set('');
    this.currentSection.set(null);
  }

  onPanelWidthChange(width: string): void {
    this.sidePanelWidth.set(width);
  }

  onCheckCompleted(sectionsChecked: string[]): void {
    const donorId = this.currentCheckDonorId();
    const batchId = this.filterForm.get('batchId')?.value;

    if (donorId && batchId) {
      this.apiService.checkDonor({
        donorId,
        batchId,
        sectionsChecked
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadBatchDetails();
          },
          error: (err) => {
            const msg = err?.displayMessage || PDMQ_ERROR_MESSAGES.CHECK_DONOR_ERROR;
            this.snackbarService.showError(msg);
          }
        });
    }
  }

  onMergeFlagChange(donorId: string, mergeFlag: string): void {
    const batchId = this.filterForm.get('batchId')?.value;
    if (!batchId) return;

    this.apiService.updateMergeFlag(batchId, donorId, mergeFlag)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadBatchDetails();
        },
        error: (err) => {
          this.snackbarService.showError(err?.displayMessage || 'Failed to update merge flag');
        }
      });
  }

  loadMergeStatuses(donorId: string): void {
    const batchId = this.filterForm.get('batchId')?.value;
    if (!batchId) return;

    this.apiService.getMergeStatuses(batchId, donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (statuses) => {
          this.mergeStatusOptions.set(statuses);
        },
        error: () => {
          this.mergeStatusOptions.set([]);
        }
      });
  }

  isInvestigationPending(donorId: string): boolean {
    const donor = this.donors().find(d => d.donorId === donorId);
    if (!donor) return true;
    const sections: CheckSection[] = ['demographics', 'interdictions', 'donations', 'attributes'];
    return sections.some(s => donor[s]?.isChecked !== 'Y');
  }

  getMatchTooltip(donorId: string): string {
    const donor = this.donors().find(d => d.donorId === donorId);
    if (!donor?.matchFlags) return 'Investigation Pending';

    const matches: string[] = [];
    if (donor.matchFlags.lastName === 'Y') matches.push('Last Name');
    if (donor.matchFlags.ssn === 'Y') matches.push('SSN');
    if (donor.matchFlags.dob === 'Y') matches.push('Date of Birth');
    if (donor.matchFlags.sex === 'Y') matches.push('Sex');

    const matchText = matches.length > 0 ? `Matched on: ${matches.join(', ')}` : '';
    const pending = this.isInvestigationPending(donorId) ? 'Investigation Pending' : 'Investigation Complete';
    return matchText ? `${pending}\n${matchText}` : pending;
  }

  getReviewStatus(section: CheckSection): { checked: boolean; user: string; date: string } | null {
    const donorId = this.selectedDonor()?.donorId;
    if (!donorId) return null;
    const donor = this.donors().find(d => d.donorId === donorId);
    if (!donor) return null;

    const review = donor[section];
    if (!review || review.isChecked !== 'Y') return null;

    return {
      checked: true,
      user: review.reviewUserName || '',
      date: review.reviewDate ? this.formatDate(review.reviewDate) : ''
    };
  }

  formatDate(value: string): string {
    if (!value) return '--';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  formatDateTime(value: string): string {
    if (!value) return '--';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY, hh:mm A').toUpperCase() : value;
  }

  private displaySex(value: string | null | undefined): string {
    if (!value) return '--';
    const sexMap: Record<string, string> = { 'M': 'Male', 'F': 'Female' };
    return sexMap[value.toUpperCase()] || value;
  }

  private resetComponent(): void {
    this.filterForm.reset({
      batchId: '',
      batchStatus: 'PENDG',
      lastName: ''
    });
    this.batches.set([]);
    this.filteredBatches = [];
    this.batchDetails.set(null);
    this.donors.set([]);
    this.lastNameOptions.set([]);
    this.filteredLastNameOptions = [];
    this.hasRetrieved.set(false);
    this.isLoading.set(false);
    this.sidePanelOpen.set(false);
    this.selectedDonor.set(null);
  }

  get f() {
    return this.filterForm.controls;
  }

  get isRetrieveDisabled(): boolean {
    const batchId = this.filterForm.get('batchId')?.value;
    const lastName = this.filterForm.get('lastName')?.value;
    return this.isLoading() || this.isLoadingBatches() || (!batchId && !lastName);
  }

  canCommitInvestigation(): boolean {
    const batchId = this.filterForm.get('batchId')?.value;
    if (!batchId) return false;

    const batch = this.batchDetails();
    const donors = this.donors();

    // Don't allow committing if already resolved
    if (batch?.batch.status === 'RESOL') return false;

    if (donors.length === 0) return false;

    // Check if all sections are reviewed for all donors
    return donors.every(donor => {
      const sections: CheckSection[] = ['demographics', 'keydata', 'interdictions', 'donations', 'attributes'];
      return sections.every(s => donor[s]?.isChecked === 'Y');
    });
  }

  onSaveChanges(): void {
    const batchId = this.filterForm.get('batchId')?.value;
    if (!batchId) {
      this.snackbarService.showError('No batch selected');
      return;
    }

    this.isSaving.set(true);

    // Just reload the batch details to show current saved state
    this.apiService.getBatchDetails(batchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.snackbarService.showSuccess('Changes saved successfully');
          this.loadBatchDetails();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.snackbarService.showError(err?.displayMessage || 'Failed to save changes');
        }
      });
  }

  onCommitInvestigation(): void {
    const batchId = this.filterForm.get('batchId')?.value;
    if (!batchId) {
      this.snackbarService.showError('No batch selected');
      return;
    }

    if (!this.canCommitInvestigation()) {
      this.snackbarService.showError('Please complete all investigation sections before committing');
      return;
    }

    this.isCommitting.set(true);

    // Update the set status to RESOL (Resolved)
    this.apiService.updateSetStatus(batchId, { statusCode: 'RESOL' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isCommitting.set(false);
          this.snackbarService.showSuccess('Investigation committed successfully');

          // Reset the form and reload the batches
          this.resetComponent();
          this.loadBatches();
          this.loadLastNames();
        },
        error: (err) => {
          this.isCommitting.set(false);
          const msg = err?.displayMessage || 'Failed to commit investigation';
          this.snackbarService.showError(msg);
        }
      });
  }
}
