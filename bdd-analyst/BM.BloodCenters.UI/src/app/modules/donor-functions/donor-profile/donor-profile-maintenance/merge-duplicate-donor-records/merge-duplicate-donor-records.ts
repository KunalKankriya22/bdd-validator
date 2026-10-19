import { Component, OnInit, OnDestroy, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { MessageDialog } from '@shared/components/message-dialog/message-dialog';
import { MessageDialogData } from '@shared/interfaces/auth.interface';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { CommentsDialog } from './components/comments-dialog/comments-dialog';
import { FindDonorDialog } from '@shared/components/find-donor/find-donor';
import { DonorInterdictionsContentComponent } from '../../donor-interdictions/donor-interdictions-content.component';
import { DonorDemographicsComponent } from '../../../donor-demographics/donor-demographics';
import { DonationDetailsDialogComponent } from '../../donation-details/donation-details-dialog/donation-details-dialog';

import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import moment from 'moment';
import { MergeDuplicateDonorRecordsService } from './services/merge-duplicate-donor-records.service';
import {
  BatchLookupModel,
  DuplicateDonorModel,
  MergeDonorInterdiction,
  MergeDonorHoldUnit
} from './models/merge-duplicate-donor-records.model';

@Component({
  selector: 'app-merge-duplicate-donor-records',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    DonorInterdictionsContentComponent,
    DonorDemographicsComponent,
    CommentsDialog
  ],
  providers: [],
  templateUrl: './merge-duplicate-donor-records.html',
  styleUrls: ['./merge-duplicate-donor-records.scss']
})
export class MergeDuplicateDonorRecordsComponent implements OnInit, OnDestroy {
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  // Form controls
  batchControl = new FormControl('', Validators.required);
  readonly batchSearchControl = new FormControl('');
  readonly batchOptions = signal<BatchLookupModel[]>([]);
  filteredBatchOptions: BatchLookupModel[] = [];
  private selectedBatch: BatchLookupModel | null = null;

  // Batch data
  currentBatchId: string = '';
  foundOn: string = '';

  // Donor data
  primaryDonor: DuplicateDonorModel | null = null;
  secondaryDonor: DuplicateDonorModel | null = null;
  finalPreviewDonor: DuplicateDonorModel | null = null;
  potentialDuplicates: DuplicateDonorModel[] = [];

  // False donor data (for resolve flow)
  falseDonor1: DuplicateDonorModel | null = null;
  falseDonor2: DuplicateDonorModel | null = null;

  // Table data
  interdictions: MergeDonorInterdiction[] = [];
  unitsToBeChecked: MergeDonorHoldUnit[] = [];

  // Merge note from Comments dialog (single note for the merge operation)
  mergeNote: string = '';

  // UI state
  isLoading = false;
  isProcessing = false;
  hasSearched = false;
  isMerged = false;
  isRetrieved = false;
  selectedDonorId: string = '';

  // Side panel state
  sidePanelOpen = signal<boolean>(false);
  sidePanelWidth = signal<string>('70vw');
  sidePanelDonorId = signal<string>('');
  currentSection = signal<'interdictions' | 'demographics' | 'comments' | null>(null);

  // Chapter ID from user context
  currentChapterId: string = '';

  // Table configurations
  interdictionsTableConfig!: DataTableConfig<MergeDonorInterdiction>;
  unitsTableConfig!: DataTableConfig<MergeDonorHoldUnit>;
  potentialDuplicatesTableConfig!: DataTableConfig<DuplicateDonorModel>;

  private destroy$ = new Subject<void>();

  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);

  constructor(
    private donorService: MergeDuplicateDonorRecordsService,
    private dialog: MatDialog,
    private headerService: HeaderService
  ) {
    this.initializeConfigurations();

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
          subtitle: pageData.subtitle || 'Review and merge duplicate donor records.'
        };
      }
    });
  }

  ngOnInit(): void {
    this.currentChapterId = this.headerService.chapterId();

    this.setupBatchSearch();
    this.initializeTableConfigs();
    this.subscribeToChapterChanges();
    this.loadBatchOptions();
  }

  private setupBatchSearch(): void {
    this.batchSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredBatchOptions = this.batchOptions().filter(b =>
          b.setId.toLowerCase().includes(term)
        );
      });
  }

  onBatchSelected(): void {
    this.isRetrieved = false;
    const selectedId = this.batchControl.value;
    if (selectedId) {
      const batch = this.batchOptions().find(b => b.setId === selectedId);
      if (batch) {
        if (this.selectedBatch && this.selectedBatch.setId !== selectedId) {
          this.clearData();
          this.hasSearched = false;
        }
        this.selectedBatch = batch;
        this.foundOn = batch.foundOn || '';
      }
    }
  }

  private loadBatchOptions(): void {
    this.donorService.searchBatchesLov(50, 0, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.batchOptions.set(result.data);
          this.filteredBatchOptions = [...result.data];
        },
        error: () => {
          this.batchOptions.set([]);
          this.filteredBatchOptions = [];
        }
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentChapterId = this.headerService.chapterId();
        this.resetForm();
        this.loadBatchOptions();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        {
          label: 'Home',
          link: '/home'
        },
        {
          label: 'Merge & Resolve Duplicate Donors',
          link: null
        }
      ],
      title: 'Merge & Resolve Duplicate Donors',
      subtitle: 'Review and merge duplicate donor records.',
      actions: []
    };
  }

  private initializeTableConfigs(): void {
    // Potential Duplicates Table Config
    this.potentialDuplicatesTableConfig = {
      columns: [
        {
          key: 'flag',
          header: 'Flag',
          type: 'text',
          sortable: false,
          valueFormatter: (value: any) => this.displayValue(value)
        },
        {
          key: 'donorId',
          header: 'Donor ID',
          type: 'text',
          sortable: false
        },
        {
          key: 'donorName',
          header: 'Name',
          type: 'text',
          sortable: false
        }
      ],
      rowActions: [
        {
          icon: 'add_circle_outline',
          action: 'add',
          ariaLabel: 'Add to card',
          color: 'primary',
          visible: (row: DuplicateDonorModel) => !!row.donorId && !this.isDonorInCard(row),
          disabled: () => this.isMerged
        },
        {
          icon: 'remove_circle_outline',
          action: 'remove',
          ariaLabel: 'Remove from card',
          color: 'primary',
          visible: (row: DuplicateDonorModel) => !!row.donorId && this.isDonorInCard(row),
          disabled: () => this.isMerged
        }
      ],
      enableRowHighlight: true,
      showPagination: false,
      emptyMessage: 'Please retrieve a Batch ID.',
      noDataIcon: 'search'
    };

    // Interdictions/Attributes Table Config
    this.interdictionsTableConfig = {
      columns: [
        {
          key: 'interCode',
          header: 'Code',
          type: 'text',
          sortable: false
        },
        {
          key: 'effDate',
          header: 'Effective Date',
          type: 'text',
          sortable: false,
          valueFormatter: (value: string) => this.formatDate(value)
        },
        {
          key: 'termDate',
          header: 'Termination Date',
          type: 'text',
          sortable: false,
          valueFormatter: (value: string) => this.formatDate(value)
        },
        {
          key: 'description',
          header: 'Description',
          type: 'text',
          sortable: false
        }
      ],
      showPagination: false,
      emptyMessage: 'No interdictions/attributes found',
      noDataIcon: 'edit'
    };

    // Units to be Checked Table Config
    this.unitsTableConfig = {
      columns: [
        {
          key: 'donorId',
          header: 'Donor ID',
          type: 'text',
          sortable: false
        },
        {
          key: 'unitId',
          header: 'Unit ID',
          type: 'text',
          sortable: false
        },
        {
          key: 'collDate',
          header: 'Collection Date',
          type: 'text',
          sortable: false,
          valueFormatter: (value: string) => this.formatDate(value)
        },
        {
          key: 'status',
          header: 'Status',
          type: 'text',
          sortable: false
        }
      ],
      showPagination: false,
      emptyMessage: 'No units to be checked',
      noDataIcon: 'edit'
    };
  }

  onRetrieve(): void {
    this.batchControl.markAsTouched();
    if (this.batchControl.invalid || !this.batchControl.value?.trim()) {
      return;
    }

    this.isLoading = true;
    this.mergeNote = '';
    const batchId = this.batchControl.value.trim();

    this.donorService.retrieveBatch({
      setId: batchId
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.hasSearched = true;
          this.isRetrieved = true;

          if (response && response.setId && response.duplicates && response.duplicates.length > 0) {
            this.currentBatchId = response.setId;
            this.foundOn = response.foundOn;

            const nonPendingDonors = response.duplicates.filter(d => d.setStatusCode && d.setStatusCode !== 'PENDG');

            if (nonPendingDonors.length > 0) {
              const statusCodes = nonPendingDonors.map(d => `${d.donorId}: ${d.setStatusCode}`).join(', ');

              this.snackbarService.showError(
                `Batch "${response.setId}" cannot be merged. Some donors are not in PENDING status: ${statusCodes}.`
              );
              this.clearData();
              return;
            }

            // Map duplicates array to potentialDuplicates
            const duplicates = response.duplicates;

            // Map API fields to backward compatibility fields
            duplicates.forEach((donor, index) => {
              // Map gender to sex for backward compatibility
              if (donor.gender && !donor.sex) {
                donor.sex = donor.gender;
              }

              // Map mergeFlag to flag for backward compatibility
              if (donor.mergeFlag && !donor.flag) {
                // Map API values to display values (support both SECON and SECND)
                if (donor.mergeFlag === 'PRIMR') {
                  donor.flag = 'Primary';
                } else if (donor.mergeFlag === 'SECON' || donor.mergeFlag === 'SECND') {
                  donor.flag = 'Secondary';
                } else if (donor.mergeFlag === 'FALSE') {
                  donor.flag = 'FALSE';
                } else if (donor.mergeFlag === 'NOMER') {
                  donor.flag = 'NOMER';
                } else {
                  donor.flag = donor.mergeFlag as any;
                }
              }

              // Fallback if neither flag nor mergeFlag exist
              if (!donor.flag && !donor.mergeFlag) {
                donor.flag = index === 0 ? 'Primary' : 'Secondary';
              }
            });

            this.potentialDuplicates = duplicates;

            // Keep cards empty initially - user must click add icon to populate
            this.primaryDonor = null;
            this.secondaryDonor = null;
            this.finalPreviewDonor = null;

            // Clear interdictions and units - they will be populated after merge
            this.interdictions = [];
            this.unitsToBeChecked = [];
          } else {
            this.clearData();
            this.snackbarService.showInfo('No batch found matching the criteria.');
          }
        },
        error: () => {
          this.isLoading = false;
          this.clearData();
          // Error snackbar handled by global error interceptor
        }
      });
  }

  isDonorInCard(donor: DuplicateDonorModel): boolean {
    if (donor.flag === 'FALSE') {
      return this.falseDonor1?.donorId === donor.donorId || this.falseDonor2?.donorId === donor.donorId;
    } else {
      // For Primary/Secondary mode, check if donor is in either card (regardless of flag)
      return this.primaryDonor?.donorId === donor.donorId || this.secondaryDonor?.donorId === donor.donorId;
    }
  }

  isMergeButtonDisabled(): boolean {
    if (this.isMerged) {
      return true;
    }

    if (this.hasIncompleteChecks()) {
      return true;
    }

    // Always disable merge button if in FALSE duplicate mode
    if (this.isFalseDuplicateMode()) {
      return true;
    }

    // Disable if both donors are not selected
    if (!this.primaryDonor || !this.secondaryDonor) {
      return true;
    }

    // Enable only if we have Primary and Secondary flags
    const hasPrimarySecondary = this.potentialDuplicates.some(donor =>
      donor.flag === 'Primary' || donor.mergeFlag === 'PRIMR'
    ) && this.potentialDuplicates.some(donor =>
      donor.flag === 'Secondary' || donor.mergeFlag === 'SECON'
    );

    return !hasPrimarySecondary;
  }

  isResolveButtonDisabled(): boolean {
    if (this.hasIncompleteChecks()) {
      return true;
    }

    // For FALSE mode, check if both false donors are selected
    if (this.isFalseDuplicateMode()) {
      return !this.falseDonor1 || !this.falseDonor2;
    }

    // For Primary/Secondary mode, resolve is disabled
    // (Only enable resolve when flag value is FALSE)
    return true;
  }

  displayValue(value: any): string {
    // Return '--' if value is null, undefined, empty string, or already '--'
    if (!value || value === '-' || value === '--' || (typeof value === 'string' && value.trim() === '')) {
      return '-';
    }

    // Map flag values for display
    if (value === 'FALSE') {
      return 'False';
    }
    if (value === 'PRIMR') {
      return 'Primary';
    }
    if (value === 'SECON') {
      return 'Secondary';
    }

    return value;
  }

  formatDate(value: string): string {
    if (!value) return '-';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  formatSex(sex: string): string {
    if (!sex) {
      return '-';
    }

    const upperSex = sex.toUpperCase();
    if (upperSex === 'M' || upperSex === 'MALE') {
      return 'Male';
    } else if (upperSex === 'F' || upperSex === 'FEMALE') {
      return 'Female';
    }

    return sex; // Return original if not M or F
  }

  formatFoundOn(dateString: string): string {
    if (!dateString) return '-';
    return DateFieldValidationUtility.formatDateTimeWithMeridiem(dateString) || '--';
  }

  hasIncompleteChecks(): boolean {
    return this.potentialDuplicates.some(donor =>
      donor.demographicsCheck === 'N' ||
      donor.interdictionsCheck === 'N' ||
      donor.donationsCheck === 'N' ||
      donor.attributesCheck === 'N' ||
      donor.keydataCheck === 'N'
    );
  }

  getIncompleteCheckNames(): string[] {
    const incomplete = new Set<string>();
    this.potentialDuplicates.forEach(donor => {
      if (donor.demographicsCheck === 'N') incomplete.add('Demographics');
      if (donor.interdictionsCheck === 'N') incomplete.add('Interdictions');
      if (donor.donationsCheck === 'N') incomplete.add('Donations');
      if (donor.attributesCheck === 'N') incomplete.add('Attributes');
      if (donor.keydataCheck === 'N') incomplete.add('Key Data');
    });
    return Array.from(incomplete);
  }

  getIncompleteChecksTooltip(): string {
    if (!this.hasIncompleteChecks()) return '';
    const names = this.getIncompleteCheckNames();
    return `Incomplete checks: ${names.join(', ')}`;
  }

  isFalseDuplicateMode(): boolean {
    // Check if all potential duplicates have 'FALSE' flag (check both flag and mergeFlag)
    return this.potentialDuplicates.length > 0 &&
           this.potentialDuplicates.every(donor => donor.flag === 'FALSE' || donor.mergeFlag === 'FALSE');
  }

  getDisplayRows(): DuplicateDonorModel[] {
    // If we have actual data, return only the actual donors (2 rows)
    if (this.potentialDuplicates.length > 0) {
      return this.potentialDuplicates;
    }

    // After RETRIEVE is clicked but no data, or while loading, return 4 empty placeholder rows
    if (this.hasSearched) {
      return Array(4).fill(null).map(() => ({
        donorId: '',
        donorName: '',
        dateOfBirth: '',
        gender: '',
        sex: '',
        mergeFlag: '',
        flag: '' as any
      }));
    }

    // Before RETRIEVE, return empty array (table won't show)
    return [];
  }

  onToggleDonorCard(donor: DuplicateDonorModel): void {
    if (this.isMerged) {
      return;
    }

    // Don't allow selecting donors with NOMER flag
    if (donor.flag === 'NOMER') {
      this.snackbarService.showInfo('This donor cannot be selected for merge.');
      return;
    }

    // Handle FALSE flag donors differently
    if (donor.flag === 'FALSE') {
      const isInCard = this.falseDonor1?.donorId === donor.donorId || this.falseDonor2?.donorId === donor.donorId;

      if (isInCard) {
        // Remove from card
        if (this.falseDonor1?.donorId === donor.donorId) {
          this.falseDonor1 = null;
        } else if (this.falseDonor2?.donorId === donor.donorId) {
          this.falseDonor2 = null;
        }
      } else {
        // Add to card
        if (!this.falseDonor1) {
          this.falseDonor1 = { ...donor };
        } else if (!this.falseDonor2) {
          this.falseDonor2 = { ...donor };
        } else {
          this.snackbarService.showInfo('Both false donor slots are already filled. Remove one first.');
        }
      }
      return;
    }

    // Handle Primary/Secondary donors
    const isInCard = this.isDonorInCard(donor);

    if (isInCard) {
      // Remove from card - check which card the donor is actually in
      if (this.primaryDonor?.donorId === donor.donorId) {
        this.primaryDonor = null;
      } else if (this.secondaryDonor?.donorId === donor.donorId) {
        this.secondaryDonor = null;
      }
      this.finalPreviewDonor = null;
    } else {
      const flag = donor.mergeFlag || '';

      if (flag === 'PRIMR') {
        if (this.primaryDonor) {
          this.snackbarService.showInfo('Primary donor is already selected. Remove it first.');
        } else {
          this.primaryDonor = { ...donor };
          if (this.secondaryDonor) {
            this.callPreviewAPI();
          }
        }
      } else if (flag === 'SECON') {
        if (!this.primaryDonor) {
          this.snackbarService.showError('Error 16093: Primary donor must be selected first.');
        } else if (this.secondaryDonor) {
          this.snackbarService.showInfo('Secondary donor is already selected. Remove it first.');
        } else {
          this.secondaryDonor = { ...donor };
          this.callPreviewAPI();
        }
      } else {
        this.snackbarService.showError('Invalid merge flag. Cannot place this donor.');
      }
    }
  }

  transferToPrimary(): void {
    if (this.primaryDonor && this.secondaryDonor) {
      this.finalPreviewDonor = null;
      this.callPreviewAPI();
    }
  }

  transferToSecondary(): void {
    if (this.primaryDonor && this.secondaryDonor) {
      this.finalPreviewDonor = null;
      this.callPreviewAPI();
    }
  }

  swapDonors(): void {
    if (this.primaryDonor && this.secondaryDonor) {
      const temp = this.primaryDonor;
      this.primaryDonor = this.secondaryDonor;
      this.secondaryDonor = temp;
      this.finalPreviewDonor = null;
      this.callPreviewAPI();
    }
  }

  /**
   * Call preview API when both donors are selected
   */
  private callPreviewAPI(): void {
    if (!this.primaryDonor || !this.secondaryDonor) {
      return;
    }

    this.donorService.previewMerge({
      primaryDonorId: this.primaryDonor.donorId,
      secondaryDonorId: this.secondaryDonor.donorId
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const preview = response?.item || response?.data?.[0];
          if (preview) {
            if (preview.primaryDonor) {
              this.finalPreviewDonor = {
                donorId: preview.primaryDonor.donorId,
                donorName: `${preview.primaryDonor.firstName} ${preview.primaryDonor.lastName}`,
                dateOfBirth: preview.primaryDonor.dateOfBirth,
                gender: preview.primaryDonor.gender,
                sex: preview.primaryDonor.gender,
                mergeFlag: 'PRIMR',
                flag: 'Primary',
                bloodType: preview.primaryDonor.bloodType
              };
            }

            if (preview.warnings && preview.warnings.length > 0) {
              this.snackbarService.showInfo(preview.warnings.join('\n'));
            }
          }
        },
        error: () => {
          this.finalPreviewDonor = null;
          // Error snackbar handled by global error interceptor
        }
      });
  }

  resolveDonors(): void {
    // For FALSE mode, check falseDonor1 and falseDonor2
    // For Primary/Secondary mode, check primaryDonor and secondaryDonor
    const isFalseMode = this.isFalseDuplicateMode();

    if (isFalseMode) {
      if (!this.falseDonor1 || !this.falseDonor2) {
        return;
      }
    } else {
      if (!this.primaryDonor || !this.secondaryDonor) {
        return;
      }

      // Check if donors have FALSE flag (not actual duplicates)
      const hasFalseFlag = this.potentialDuplicates.some(donor => donor.flag === 'FALSE');

      if (!hasFalseFlag) {
        this.snackbarService.showInfo('Resolve is only for FALSE duplicates. Use MERGE for actual duplicates.');
        return;
      }
    }

    const dialogData: MessageDialogData = {
      title: 'Are you sure you want to resolve the donors?',
      message: 'Do you want to move donors into resolve false duplicate. This operation cannot be reversed.',
      primaryAction: { label: 'CONFIRM', action: 'confirm' },
      secondaryAction: { label: 'CANCEL', action: 'cancel' }
    };

    const dialogRef = this.dialog.open(MessageDialog, {
      width: '585px',
      panelClass: 'resolve-confirmation-dialog',
      data: dialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result === 'confirm') {
          this.performResolve();
        }
      });
  }

  private performResolve(): void {
    const isFalseMode = this.isFalseDuplicateMode();
    let firstDonorId: string;
    let secondDonorId: string;

    if (isFalseMode) {
      if (!this.falseDonor1 || !this.falseDonor2) {
        return;
      }
      firstDonorId = this.falseDonor1.donorId;
      secondDonorId = this.falseDonor2.donorId;
    } else {
      if (!this.primaryDonor || !this.secondaryDonor) {
        return;
      }
      firstDonorId = this.primaryDonor.donorId;
      secondDonorId = this.secondaryDonor.donorId;
    }

    this.isProcessing = true;

    this.donorService.resolveDonors({
      setId: this.currentBatchId.trim(),
      firstDonorId: firstDonorId.trim(),
      secondDonorId: secondDonorId.trim()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isProcessing = false;

          if (response?.success) {
            this.snackbarService.showSuccess(
              `Duplicate donors ${secondDonorId} to ${firstDonorId} has been resolved successfully.`
            );
            this.resetForm();
          } else {
            this.snackbarService.showError(response?.message || 'Resolve operation failed.');
          }
        },
        error: () => {
          this.isProcessing = false;
          // Error snackbar handled by global error interceptor
        }
      });
  }

  mergeDonors(): void {
    if (!this.primaryDonor || !this.secondaryDonor) {
      return;
    }

    // Enforce business rule: Primary donor must be selected first
    if (this.primaryDonor.flag !== 'Primary' && this.primaryDonor.mergeFlag !== 'PRIMR') {
      this.snackbarService.showError('Error 16093: Primary donor must have Primary flag.');
      return;
    }

    // Enforce business rule: Secondary donor must be selected second
    if (this.secondaryDonor.flag !== 'Secondary' && this.secondaryDonor.mergeFlag !== 'SECON') {
      this.snackbarService.showError('Error 16094: Secondary donor must have Secondary flag.');
      return;
    }

    const dialogData: MessageDialogData = {
      title: 'Are you sure you want to merge the duplicate donors?',
      message: 'This action cannot be undone. The source record will be permanently deleted.',
      primaryAction: { label: 'CONFIRM', action: 'confirm' },
      secondaryAction: { label: 'CANCEL', action: 'cancel' }
    };

    const dialogRef = this.dialog.open(MessageDialog, {
      width: '585px',
      panelClass: 'merge-confirmation-dialog',
      data: dialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result === 'confirm') {
          this.performMerge();
        }
      });
  }

  private performMerge(): void {
    if (!this.primaryDonor || !this.secondaryDonor) {
      return;
    }

    // Enhanced validation for batch ID
    if (!this.currentBatchId || this.currentBatchId.trim() === '') {
      this.snackbarService.showError('Invalid batch ID. Please retrieve a valid batch first.');
      return;
    }

    this.isProcessing = true;

    const mergeRequest: any = {
      setId: this.currentBatchId.trim(),
      primaryDonorId: this.primaryDonor.donorId.trim(),
      secondaryDonorId: this.secondaryDonor.donorId.trim(),
      note: this.mergeNote
    };

    this.donorService.mergeDonors(mergeRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isProcessing = false;

          if (response?.success) {
            const mergeResult = response.item || response.data?.[0];

            const secondaryId = mergeResult?.secondaryDonorId || this.secondaryDonor?.donorId;
            const primaryId = mergeResult?.primaryDonorId || this.primaryDonor?.donorId;
            const successMessage = `Duplicate donors ${secondaryId} to ${primaryId} has been merged successfully.`;

            this.snackbarService.showSuccess(successMessage);
            this.resetForm();
            this.loadBatchOptions();

          } else {
            this.snackbarService.showError(response?.message || 'Merge operation failed.');
          }
        },
        error: () => {
          this.isProcessing = false;
          // Error snackbar handled by global error interceptor
        }
      });
  }

  private resetForm(): void {
    this.batchControl.reset();
    this.clearData();
    this.hasSearched = false;
  }

  private clearData(): void {
    this.currentBatchId = '';
    this.foundOn = '';
    this.primaryDonor = null;
    this.secondaryDonor = null;
    this.finalPreviewDonor = null;
    this.falseDonor1 = null;
    this.falseDonor2 = null;
    this.potentialDuplicates = [];
    this.interdictions = [];
    this.unitsToBeChecked = [];
    this.mergeNote = '';
    this.isMerged = false;
    this.isRetrieved = false;
    this.batchControl.enable();
    this.selectedDonorId = '';
    this.selectedBatch = null;
    this.loadBatchOptions();
  }

  isDobMismatch(): boolean {
    if (!this.primaryDonor?.dateOfBirth || !this.secondaryDonor?.dateOfBirth) return false;
    return this.primaryDonor.dateOfBirth !== this.secondaryDonor.dateOfBirth;
  }

  isSexMismatch(): boolean {
    const primarySex = (this.primaryDonor?.sex || this.primaryDonor?.gender || '').toUpperCase();
    const secondarySex = (this.secondaryDonor?.sex || this.secondaryDonor?.gender || '').toUpperCase();
    if (!primarySex || !secondarySex) return false;
    return primarySex !== secondarySex;
  }

  get canMerge(): boolean {
    return !!(this.primaryDonor && this.secondaryDonor && !this.isLoading);
  }

  get canResolve(): boolean {
    return !!(this.primaryDonor && this.secondaryDonor && !this.isLoading);
  }

  get emptyStateMessage(): string {
    if (!this.hasSearched) {
      return 'Nothing to Display';
    }
    return 'No batch found matching the criteria';
  }

  onDuplicateRowClick(donor: DuplicateDonorModel): void {
    if (!donor.donorId) return;
    this.selectedDonorId = donor.donorId;
  }

  onDuplicateRowAction(event: { action: string; row: DuplicateDonorModel }): void {
    if (event.action === 'add' || event.action === 'remove') {
      this.onToggleDonorCard(event.row);
    }
  }

  private getActiveDonorId(): string {
    return this.selectedDonorId
      || this.primaryDonor?.donorId
      || this.secondaryDonor?.donorId
      || this.potentialDuplicates[0]?.donorId
      || '';
  }

  openDemographics(): void {
    const donorId = this.getActiveDonorId();
    if (!donorId) return;
    this.openSidePanel('demographics', donorId);
  }

  openInterdictions(): void {
    const donorId = this.getActiveDonorId();
    if (!donorId) return;
    this.openSidePanel('interdictions', donorId);
  }

  openDonations(): void {
    const donorId = this.getActiveDonorId();
    if (!donorId) return;
    this.dialog.open(DonationDetailsDialogComponent, {
      width: '1400px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: { donorId },
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    });
  }

  private openSidePanel(section: 'interdictions' | 'demographics' | 'comments', donorId: string): void {
    this.sidePanelDonorId.set(donorId);
    this.currentSection.set(section);
    this.sidePanelWidth.set('70vw');
    this.sidePanelOpen.set(true);
  }

  onPanelClose(): void {
    const wasInvestigationPanel = this.currentSection() === 'demographics' || this.currentSection() === 'interdictions';
    this.sidePanelOpen.set(false);
    this.sidePanelWidth.set('70vw');
    this.sidePanelDonorId.set('');
    this.currentSection.set(null);

    if (wasInvestigationPanel && this.currentBatchId) {
      this.refreshBatchChecks();
    }
  }

  private refreshBatchChecks(): void {
    this.donorService.retrieveBatch({ setId: this.currentBatchId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response?.duplicates) {
            response.duplicates.forEach(donor => {
              const existing = this.potentialDuplicates.find(d => d.donorId === donor.donorId);
              if (existing) {
                existing.demographicsCheck = donor.demographicsCheck;
                existing.interdictionsCheck = donor.interdictionsCheck;
                existing.donationsCheck = donor.donationsCheck;
                existing.attributesCheck = donor.attributesCheck;
                existing.keydataCheck = donor.keydataCheck;
                existing.allChecksComplete = donor.allChecksComplete;
              }
            });
          }
        }
      });
  }

  onPanelWidthChange(width: string): void {
    this.sidePanelWidth.set(width);
  }

  navigateToFindDonor(): void {
    const dialogRef = this.dialog.open(FindDonorDialog, {
      width: '90vw',
      maxWidth: '68vw',
      height: '91.7vh',
      hasBackdrop: true,
      disableClose: true,
      data: { programName: 'DPIMERGE' },
      position: {
        right: '0',
        bottom: '0'
      },
      panelClass: 'find-donor-dialog'
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result?.action === 'select' && result.donor) {
            const selectedId = result.donor.donorId || result.donor.id;
            if (selectedId) {
              const match = this.potentialDuplicates.find(d => d.donorId === selectedId);
              if (match) {
                this.selectedDonorId = selectedId;
                this.snackbarService.showInfo(`Donor ${selectedId} selected.`);
              } else {
                this.snackbarService.showInfo(`Donor ${selectedId} is not in the current batch.`);
              }
            }
          }
        },
        error: () => {}
      });
  }

  openCommentsPanel(): void {
    this.sidePanelDonorId.set('comments');
    this.currentSection.set('comments');
    this.sidePanelWidth.set('550px');
    this.sidePanelOpen.set(true);
  }

  onCommentsSave(note: string): void {
    this.mergeNote = note;
    this.snackbarService.showSuccess('Merge note saved. It will be submitted when you merge.');
    this.onPanelClose();
  }

}