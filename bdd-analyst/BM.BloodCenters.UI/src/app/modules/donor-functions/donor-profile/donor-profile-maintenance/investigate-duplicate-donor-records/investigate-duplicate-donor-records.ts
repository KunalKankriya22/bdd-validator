import { Component, OnInit, OnDestroy, signal, effect, inject, computed, ViewChild, TemplateRef, AfterViewInit, HostListener } from '@angular/core';

import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoginService } from '@shared/services/login.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableColumn } from '@shared/interfaces/data-table.interface';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { AlternateDemographicsDialogComponent } from '@shared/components/alternate-demographics-dialog/alternate-demographics-dialog.component';
import { AlternateDemographicsDialogData } from '@shared/models/alternate-demographics.model';

import { DonorDemographicsComponent } from '../../../donor-demographics/donor-demographics';
import { DonorInterdictionsContentComponent } from '../../donor-interdictions/donor-interdictions-content.component';
import { DonorWithinTestDialogComponent } from '../../../donor-within-test/donor-within-test-dialog.component';
import { DonorAttributesComponent } from '../donor-attributes/donor-attributes.component';
import { DonationDetailsDialogComponent } from '../../donation-details/donation-details-dialog/donation-details-dialog';

import { InvestigateDuplicateDonorRecordsApiService } from './services/investigate-duplicate-donor-records-api.service';
import { InvestigateDuplicateStateService } from './services/investigate-duplicate-state.service';
import { DonorDemographicsService } from '../../../donor-demographics/services/donor-demographics.service';
import {
  InvestigateBatch,
  InvestigateDonor,
  InvestigateBatchDetails,
  InvestigateDonorRow,
  InvestCheckSection,
  StatusCode,
  MergeFlag,
  CreateSetRow,
  INVEST_ERROR_MESSAGES,
  BATCH_STATUS_LABELS,
  MERGE_FLAG_LABELS,
  CHECK_SECTION_CONFIG,
  SECTION_TO_CATEGORY
} from './models/investigate-duplicate-donor-records.model';

@Component({
  selector: 'app-investigate-duplicate-donor-records',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatInputModule,
    MatCheckboxModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    DonorDemographicsComponent,
    DonorInterdictionsContentComponent,
    DonorWithinTestDialogComponent,
    DonorAttributesComponent
  ],
  templateUrl: './investigate-duplicate-donor-records.html',
  styleUrls: ['./investigate-duplicate-donor-records.scss']
})
export class InvestigateDuplicateDonorRecords implements OnInit, OnDestroy, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(InvestigateDuplicateDonorRecordsApiService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly loginService = inject(LoginService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly stateService = inject(InvestigateDuplicateStateService);
  private readonly donorDemographicsService = inject(DonorDemographicsService);

  private destroy$ = new Subject<void>();

  @ViewChild('donorIdCellTemplate', { static: true }) donorIdCellTemplate!: TemplateRef<unknown>;
  @ViewChild('diffCellDonorName', { static: true }) diffCellDonorName!: TemplateRef<unknown>;
  @ViewChild('diffCellHomeNumber', { static: true }) diffCellHomeNumber!: TemplateRef<unknown>;
  @ViewChild('diffCellAddress', { static: true }) diffCellAddress!: TemplateRef<unknown>;
  @ViewChild('altAddressCellTemplate', { static: true }) altAddressCellTemplate!: TemplateRef<unknown>;
  @ViewChild('mergeFlagCellTemplate', { static: true }) mergeFlagCellTemplate!: TemplateRef<unknown>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' }
    ],
    title: '',
    subtitle: ''
  };

  filterForm!: FormGroup;

  batches = signal<InvestigateBatch[]>([]);
  filteredBatches: InvestigateBatch[] = [];
  batchSearchControl = new FormControl('');
  batchStatusControl = new FormControl('');

  batchDetails = signal<InvestigateBatchDetails | null>(null);
  donors = signal<InvestigateDonor[]>([]);

  statusCodes = signal<StatusCode[]>([]);

  private tableRefreshTrigger = signal(0);

  tableData = computed<InvestigateDonorRow[]>(() => {
    this.tableRefreshTrigger();
    const donors = this.donors();
    if (!donors || donors.length === 0) return [];

    const primaryDonor = donors.find(d => d.mergeFlag === 'PRIMR') || donors[0];

    const primaryName = primaryDonor.name || '';
    const primaryHomePhone = primaryDonor.homePhone || '';
    const primaryAddress = primaryDonor.address || '';

    const rows = donors.map(donor => {
      const isPrimary = donor.donorId === primaryDonor.donorId;
      const donorName = donor.name || '';
      const homeNumber = donor.homePhone || '';
      const address = donor.address || '';

      const highlightDonorName = !isPrimary && donorName !== primaryName;
      const highlightHomeNumber = !isPrimary && homeNumber !== primaryHomePhone;
      const highlightAddress = !isPrimary && address !== primaryAddress;

      return {
        mergeFlag: donor.mergeFlag || 'NOMER',
        donorId: donor.donorId,
        donorName: donorName || '-',
        dateOfBirth: this.formatDate(donor.dateOfBirth),
        sex: this.displaySex(donor.gender),
        workNumber: donor.workPhone || '-',
        homeNumber: homeNumber || '-',
        address: address || '-',
        altAddress: donor.altAddress || '',
        isPrimary,
        highlightDonorName,
        highlightHomeNumber,
        highlightAddress
      };
    });

    return rows;
  });

  selectedDonor = signal<InvestigateDonorRow | null>(null);

  isLoading = signal<boolean>(false);
  isLoadingBatches = signal<boolean>(false);
  hasRetrieved = signal<boolean>(false);
  sidePanelOpen = signal<boolean>(false);
  sidePanelWidth = signal<string>('70vw');
  currentCheckDonorId = signal<string>('');
  currentCheckDonorName = signal<string>('');
  currentSection = signal<InvestCheckSection | null>(null);
  isSaving = signal<boolean>(false);
  isCommitting = signal<boolean>(false);
  hasLocalChanges = signal<boolean>(false);

  localSectionChecks = signal<Record<InvestCheckSection, boolean>>({
    demographics: false,
    keydata: false,
    interdictions: false,
    donations: false,
    attributes: false
  });
  localCheckMeta = signal<Record<InvestCheckSection, { user: string; date: string } | null>>({
    demographics: null,
    keydata: null,
    interdictions: null,
    donations: null,
    attributes: null
  });
  localMergeFlag = signal<string>('');
  visitedSections = signal<Record<InvestCheckSection, boolean>>({
    demographics: false,
    keydata: false,
    interdictions: false,
    donations: false,
    attributes: false
  });

  isNewSetMode = signal<boolean>(false);
  newSetId = signal<string>('');
  createSetRows: CreateSetRow[] = [];
  private createSetRowCounter = 0;
  isSavingNewSet = signal<boolean>(false);

  readonly sectionConfig = CHECK_SECTION_CONFIG;
  readonly statusLabels = BATCH_STATUS_LABELS;
  readonly mergeFlagLabels = MERGE_FLAG_LABELS;

  tableConfig: DataTableConfig<InvestigateDonorRow> = {
    columns: [],
    stickyHeader: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Please enter search criteria to view results'
  };

  get batchStatusDisplay(): string {
    const details = this.batchDetails();
    if (!details?.batch) return '';
    return BATCH_STATUS_LABELS[details.batch.setStatusCode] || details.batch.setStatusCode;
  }

  get foundOnDisplay(): string {
    const details = this.batchDetails();
    if (!details?.batch?.foundOn) return '';
    return this.formatDateTime(details.batch.foundOn);
  }

  get isRetrieveDisabled(): boolean {
    const batchId = this.filterForm.get('batchId')?.value;
    return this.isLoading() || this.isLoadingBatches() || !batchId;
  }

  get isResolved(): boolean {
    const details = this.batchDetails();
    return details?.batch?.setStatusCode === 'RESOL';
  }

  get isCommitEnabled(): boolean {
    if (!this.hasRetrieved() || this.donors().length === 0 || this.isResolved) return false;
    const donors = this.donors();
    return donors.every(d => d.mergeFlag && d.mergeFlag !== 'NOMER' && d.mergeFlag !== '');
  }

  get isSaveDisabled(): boolean {
    return !this.hasLocalChanges() || this.isSaving() || this.isResolved;
  }

  get investigationDonorName(): string {
    const selected = this.selectedDonor();
    if (selected) return selected.donorName;
    const rows = this.tableData();
    return rows.length > 0 ? rows[0].donorName : '';
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
    this.loadStatusCodes();
    this.subscribeToChapterChanges();
    this.setupSearchFilters();
    this.restoreSavedState();
  }

  private restoreSavedState(): void {
    const saved = this.stateService.restore();
    if (!saved) return;

    this.filterForm.patchValue({ batchId: saved.batchId });

    this.apiService.getPotentialDuplicates(saved.batchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          this.batchDetails.set(details);
          this.donors.set(details.donors || []);
          this.batchStatusControl.setValue(details.batch?.setStatusCode || '', { emitEvent: false });
          this.hasRetrieved.set(true);
          this.isLoading.set(false);

          const rows = this.tableData();
          const targetRow = rows.find(r => r.donorId === saved.selectedDonorId) || rows[0];
          if (targetRow) {
            this.selectedDonor.set(targetRow);
            const donor = details.donors?.find(d => d.donorId === targetRow.donorId);
            if (donor) {
              if (saved.hadLocalChanges && saved.localChecks) {
                this.localSectionChecks.set(saved.localChecks);
                this.localCheckMeta.set(saved.localCheckMeta || {
                  demographics: null, keydata: null, interdictions: null, donations: null, attributes: null
                });
                this.localMergeFlag.set(saved.localMergeFlag || donor.mergeFlag || '');
                this.hasLocalChanges.set(true);
              } else {
                this.syncLocalStateFromDonor(donor);
              }
              this.visitedSections.update(current => ({
                demographics: current.demographics || saved.visitedSections.demographics,
                keydata: current.keydata || saved.visitedSections.keydata,
                interdictions: current.interdictions || saved.visitedSections.interdictions,
                donations: current.donations || saved.visitedSections.donations,
                attributes: current.attributes || saved.visitedSections.attributes
              }));
            }
          }
        },
        error: () => {}
      });
  }

  ngAfterViewInit(): void {
    this.initTableConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      batchId: ['', Validators.required]
    });
  }

  private initTableConfig(): void {
    const columns: TableColumn<InvestigateDonorRow>[] = [
      { key: 'mergeFlag', header: 'Merge Flag', width: '120px', cellTemplate: this.mergeFlagCellTemplate },
      { key: 'donorId', header: 'Donor ID', width: '130px', cellTemplate: this.donorIdCellTemplate },
      { key: 'donorName', header: 'Donor Name', width: '140px', cellTemplate: this.diffCellDonorName },
      { key: 'dateOfBirth', header: 'Date of Birth', width: '120px' },
      { key: 'sex', header: 'Sex', width: '90px' },
      { key: 'workNumber', header: 'Work Number', width: '120px' },
      { key: 'homeNumber', header: 'Home Number', width: '120px', cellTemplate: this.diffCellHomeNumber },
      { key: 'address', header: 'Address', minWidth: '150px', cellTemplate: this.diffCellAddress },
      { key: 'altAddress', header: 'Alt Address', width: '150px', cellTemplate: this.altAddressCellTemplate }
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
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetComponent();
        this.loadBatches();
      });
  }

  private loadBatches(): void {
    this.isLoadingBatches.set(true);

    this.apiService.getDuplicateSets({ statusCode: 'PENDG' })
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

  private loadStatusCodes(): void {
    this.apiService.getStatusCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.statusCodes.set(codes);
        },
        error: () => {
          this.statusCodes.set([]);
        }
      });
  }

  onRetrieve(): void {
    const batchId = this.filterForm.get('batchId')?.value;
    if (!batchId) {
      this.filterForm.get('batchId')?.markAsTouched();
      return;
    }

    if (batchId === 'NEW') {
      this.onRetrieveNewSet();
      return;
    }

    this.isNewSetMode.set(false);

    if (this.hasLocalChanges()) {
      const dialogData: ConfirmActionDialogData = {
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Do you want to discard them?',
        confirmText: 'DISCARD',
        cancelText: 'CANCEL'
      };

      const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
        width: '400px',
        disableClose: true,
        data: dialogData
      });

      dialogRef.afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe(result => {
          if (result === true) {
            this.hasLocalChanges.set(false);
            this.loadBatchDetails();
          }
        });
    } else {
      this.loadBatchDetails();
    }
  }

  private loadBatchDetails(): void {
    const batchId = this.filterForm.get('batchId')?.value;
    if (!batchId) return;

    this.isLoading.set(true);
    this.hasRetrieved.set(true);
    this.selectedDonor.set(null);
    this.resetLocalState();

    this.apiService.getPotentialDuplicates(batchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          this.batchDetails.set(details);
          this.donors.set(details.donors || []);
          this.batchStatusControl.setValue(details.batch?.setStatusCode || '', { emitEvent: false });
          this.isLoading.set(false);

          if (!details.donors || details.donors.length === 0) {
            this.snackbarService.showError(INVEST_ERROR_MESSAGES.NO_DONORS);
          } else {
            const rows = this.tableData();
            if (rows.length > 0) {
              this.selectedDonor.set(rows[0]);
              this.syncLocalStateFromDonor(details.donors[0]);
            }
          }
        },
        error: (err) => {
          this.batchDetails.set(null);
          this.donors.set([]);
          this.isLoading.set(false);

          const msg = err?.displayMessage || INVEST_ERROR_MESSAGES.LOAD_ERROR;
          this.snackbarService.showError(msg);
        }
      });
  }

  private syncLocalStateFromDonor(donor: InvestigateDonor): void {
    this.localSectionChecks.set({
      demographics: donor.demographics?.isChecked === 'Y',
      keydata: donor.keydata?.isChecked === 'Y',
      interdictions: donor.interdictions?.isChecked === 'Y',
      donations: donor.donations?.isChecked === 'Y',
      attributes: donor.attributes?.isChecked === 'Y'
    });
    this.localCheckMeta.set({
      demographics: null,
      keydata: null,
      interdictions: null,
      donations: null,
      attributes: null
    });
    this.visitedSections.set({
      demographics: !!donor.demographics?.reviewDate,
      keydata: !!donor.keydata?.reviewDate,
      interdictions: !!donor.interdictions?.reviewDate,
      donations: !!donor.donations?.reviewDate,
      attributes: !!donor.attributes?.reviewDate
    });
    this.localMergeFlag.set(donor.mergeFlag || '');
    this.hasLocalChanges.set(false);
  }

  private resetLocalState(): void {
    this.localSectionChecks.set({
      demographics: false,
      keydata: false,
      interdictions: false,
      donations: false,
      attributes: false
    });
    this.localCheckMeta.set({
      demographics: null,
      keydata: null,
      interdictions: null,
      donations: null,
      attributes: null
    });
    this.visitedSections.set({
      demographics: false,
      keydata: false,
      interdictions: false,
      donations: false,
      attributes: false
    });
    this.localMergeFlag.set('');
    this.hasLocalChanges.set(false);
  }

  onRowClicked(row: InvestigateDonorRow): void {
    if (this.selectedDonor()?.donorId === row.donorId) return;

    if (this.hasLocalChanges()) {
      this.autoSaveCurrentDonor().then(() => this.switchToRow(row));
    } else {
      this.switchToRow(row);
    }
  }

  private switchToRow(row: InvestigateDonorRow): void {
    this.selectedDonor.set(row);
    const donor = this.donors().find(d => d.donorId === row.donorId);
    if (donor) {
      this.syncLocalStateFromDonor(donor);
    }
  }

  onAltAddressClick(event: Event, row: InvestigateDonorRow): void {
    event.stopPropagation();

    const dialogData: AlternateDemographicsDialogData = {
      donorId: row.donorId,
      readOnly: true
    };

    this.dialog.open(AlternateDemographicsDialogComponent, {
      width: '700px',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'alt-address-side-panel',
      disableClose: false,
      data: dialogData
    });
  }

  onOpenSection(section: InvestCheckSection): void {
    const donor = this.selectedDonor() || (this.tableData().length > 0 ? this.tableData()[0] : null);
    if (!donor) return;

    if (section === 'keydata') {
      const updatedVisited = { ...this.visitedSections(), keydata: true };
      this.stateService.save({
        batchId: this.filterForm.get('batchId')?.value,
        selectedDonorId: donor.donorId,
        visitedSections: updatedVisited,
        localChecks: { ...this.localSectionChecks() },
        localCheckMeta: { ...this.localCheckMeta() },
        localMergeFlag: this.localMergeFlag(),
        hadLocalChanges: this.hasLocalChanges()
      });
      this.router.navigate(['/donor-functions/donor-profile/donor-data'], {
        state: {
          mode: 'modify',
          donorId: donor.donorId,
          fromInvestigateDuplicate: true
        }
      });
      return;
    }

    if (section === 'donations') {
      this.dialog.open(DonationDetailsDialogComponent, {
        width: '1400px',
        height: 'calc(100vh - 64px)',
        maxWidth: '100vw',
        maxHeight: 'calc(100vh - 64px)',
        position: { right: '0', top: '64px' },
        panelClass: 'code-dialog-panel-right',
        hasBackdrop: true,
        backdropClass: 'code-dialog-backdrop',
        disableClose: false,
        data: { donorId: donor.donorId }
      }).afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.visitedSections.update(current => ({ ...current, donations: true }));
        if (this.hasRetrieved() && this.filterForm.get('batchId')?.value) {
          this.refreshBatchData();
        }
      });
      return;
    }

    this.currentCheckDonorId.set(donor.donorId);
    this.currentCheckDonorName.set(donor.donorName);
    this.currentSection.set(section);
    this.sidePanelOpen.set(true);
    this.visitedSections.update(current => ({ ...current, [section]: true }));
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.sidePanelOpen()) { this.onPanelClose(); }
  }

  onPanelClose(): void {
    this.sidePanelOpen.set(false);
    this.sidePanelWidth.set('70vw');
    this.currentCheckDonorId.set('');
    this.currentCheckDonorName.set('');
    this.currentSection.set(null);

    if (this.hasRetrieved() && this.filterForm.get('batchId')?.value) {
      this.refreshBatchData();
    }
  }

  private refreshBatchData(): void {
    const batchId = this.filterForm.get('batchId')?.value;
    if (!batchId) return;

    const preservedVisited = { ...this.visitedSections() };
    const hadLocalChanges = this.hasLocalChanges();
    const preservedChecks = { ...this.localSectionChecks() };
    const preservedCheckMeta = { ...this.localCheckMeta() };
    const preservedMergeFlag = this.localMergeFlag();

    this.apiService.getPotentialDuplicates(batchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          this.batchDetails.set(details);
          this.donors.set(details.donors || []);
          this.batchStatusControl.setValue(details.batch?.setStatusCode || '', { emitEvent: false });

          const selectedId = this.selectedDonor()?.donorId;
          if (selectedId) {
            const donor = details.donors?.find(d => d.donorId === selectedId);
            if (donor) {
              if (hadLocalChanges) {
                this.localSectionChecks.set(preservedChecks);
                this.localCheckMeta.set(preservedCheckMeta);
                this.localMergeFlag.set(preservedMergeFlag);
                this.hasLocalChanges.set(true);
              } else {
                this.syncLocalStateFromDonor(donor);
              }
              this.visitedSections.update(current => ({
                demographics: current.demographics || preservedVisited.demographics,
                keydata: current.keydata || preservedVisited.keydata,
                interdictions: current.interdictions || preservedVisited.interdictions,
                donations: current.donations || preservedVisited.donations,
                attributes: current.attributes || preservedVisited.attributes
              }));
            }
          }
        },
        error: () => {}
      });
  }

  onPanelWidthChange(width: string): void {
    this.sidePanelWidth.set(width);
  }

  onMarkAsChecked(section: InvestCheckSection, checked: boolean): void {
    if (this.isResolved) return;
    this.localSectionChecks.update(current => ({
      ...current,
      [section]: checked
    }));
    if (checked) {
      const fullName = this.headerService.headerConfig()?.user?.name || '';
      const parts = fullName.trim().split(/\s+/);
      const userName = parts.length >= 2
        ? parts[0].charAt(0).toUpperCase() + '.' + parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1).toLowerCase()
        : this.headerService.getCurrentUsername();
      const now = this.getChapterNow().format('DD-MMM-YYYY, hh:mm A').toUpperCase();
      this.localCheckMeta.update(current => ({
        ...current,
        [section]: { user: userName, date: now }
      }));
    } else {
      this.localCheckMeta.update(current => ({
        ...current,
        [section]: null
      }));
    }
    this.hasLocalChanges.set(true);
  }

  onMergeFlagChange(value: string): void {
    if (this.isResolved) return;

    const originalValue = this.localMergeFlag();
    const currentDonorId = this.getSelectedDonorId();
    const otherDonors = this.donors().filter(d => d.donorId !== currentDonorId);

    let errorMsg = '';

    if (value === 'PRIMR') {
      const existingPrimary = otherDonors.find(d => d.mergeFlag === 'PRIMR');
      if (existingPrimary) {
        errorMsg = `Donor ${existingPrimary.donorId} is already marked as Primary. Only one Primary is allowed per set.`;
      }
      const existingFalse = otherDonors.find(d => d.mergeFlag === 'FALSE');
      if (!errorMsg && existingFalse) {
        errorMsg = 'Cannot set Primary when False Duplicate is already assigned in this set.';
      }
    }

    if (value === 'SECON') {
      const existingSecondary = otherDonors.find(d => d.mergeFlag === 'SECON');
      if (existingSecondary) {
        errorMsg = `Donor ${existingSecondary.donorId} is already marked as Secondary. Only one Secondary is allowed per set.`;
      }
      const existingFalse = otherDonors.find(d => d.mergeFlag === 'FALSE');
      if (!errorMsg && existingFalse) {
        errorMsg = 'Cannot set Secondary when False Duplicate is already assigned in this set.';
      }
    }

    if (value === 'FALSE') {
      const existingPrimary = otherDonors.find(d => d.mergeFlag === 'PRIMR');
      const existingSecondary = otherDonors.find(d => d.mergeFlag === 'SECON');
      if (existingPrimary || existingSecondary) {
        errorMsg = 'Cannot set False Duplicate when Primary or Secondary is already assigned in this set.';
      }
    }

    if (errorMsg) {
      this.snackbarService.showError(errorMsg);
      this.revertMergeFlag(originalValue);
      return;
    }

    this.localMergeFlag.set(value);
    this.hasLocalChanges.set(true);
  }

  private revertMergeFlag(originalValue: string): void {
    this.localMergeFlag.set('__REVERT__');
    setTimeout(() => {
      this.localMergeFlag.set(originalValue);
      this.forceTableRefresh();
    }, 0);
  }

  onInlineMergeFlagChange(value: string, row: InvestigateDonorRow): void {
    if (this.isResolved) return;

    const selectedId = this.selectedDonor()?.donorId;
    if (selectedId !== row.donorId) {
      const applyChange = () => {
        this.switchToRow(row);
        this.onMergeFlagChange(value);
      };

      if (this.hasLocalChanges()) {
        this.autoSaveCurrentDonor().then(() => applyChange());
      } else {
        applyChange();
      }
      return;
    }

    this.onMergeFlagChange(value);
  }

  private forceTableRefresh(): void {
    this.tableRefreshTrigger.update(v => v + 1);
  }

  onSaveChanges(): void {
    const batchId = this.filterForm.get('batchId')?.value;
    const donorId = this.getSelectedDonorId();
    if (!batchId || !donorId) return;

    this.isSaving.set(true);
    const checks = this.localSectionChecks();
    const sections: InvestCheckSection[] = ['demographics', 'keydata', 'interdictions', 'donations', 'attributes'];

    let completedCalls = 0;
    let hasError = false;
    let lastSuccessMessage = '';
    const totalCalls = sections.length + 1;

    const checkDone = () => {
      completedCalls++;
      if (completedCalls >= totalCalls) {
        this.isSaving.set(false);
        if (!hasError) {
          this.hasLocalChanges.set(false);
          this.snackbarService.showSuccess(lastSuccessMessage || 'Changes saved successfully');
          this.loadBatchDetails();
        }
      }
    };

    for (const section of sections) {
      this.apiService.updateReviewCategory(batchId, donorId, {
        category: SECTION_TO_CATEGORY[section],
        isChecked: checks[section]
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => { lastSuccessMessage = res?.message || lastSuccessMessage; checkDone(); },
          error: (err) => {
            if (!hasError) {
              hasError = true;
              this.snackbarService.showError(err?.displayMessage || INVEST_ERROR_MESSAGES.SAVE_ERROR);
            }
            checkDone();
          }
        });
    }

    const mergeFlag = this.localMergeFlag();
    if (mergeFlag) {
      this.apiService.updateMergeFlag(batchId, donorId, {
        mergeFlag: mergeFlag as MergeFlag
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => { lastSuccessMessage = res?.message || lastSuccessMessage; checkDone(); },
          error: (err) => {
            if (!hasError) {
              hasError = true;
              this.snackbarService.showError(err?.displayMessage || INVEST_ERROR_MESSAGES.MERGE_FLAG_ERROR);
            }
            checkDone();
          }
        });
    } else {
      checkDone();
    }
  }

  private autoSaveCurrentDonor(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.hasLocalChanges()) {
        resolve();
        return;
      }

      const batchId = this.filterForm.get('batchId')?.value;
      const donorId = this.getSelectedDonorId();
      if (!batchId || !donorId) {
        resolve();
        return;
      }

      const checks = this.localSectionChecks();
      const mergeFlag = this.localMergeFlag();
      const sections: InvestCheckSection[] = ['demographics', 'keydata', 'interdictions', 'donations', 'attributes'];

      let completedCalls = 0;
      const totalCalls = sections.length + 1;

      const checkDone = () => {
        completedCalls++;
        if (completedCalls >= totalCalls) {
          this.donors.update(donors => donors.map(d => {
            if (d.donorId !== donorId) return d;
            return {
              ...d,
              mergeFlag: mergeFlag || d.mergeFlag,
              demographics: { ...d.demographics, isChecked: checks.demographics ? 'Y' : 'N' },
              keydata: { ...d.keydata, isChecked: checks.keydata ? 'Y' : 'N' },
              interdictions: { ...d.interdictions, isChecked: checks.interdictions ? 'Y' : 'N' },
              donations: { ...d.donations, isChecked: checks.donations ? 'Y' : 'N' },
              attributes: { ...d.attributes, isChecked: checks.attributes ? 'Y' : 'N' },
            };
          }));
          this.hasLocalChanges.set(false);
          resolve();
        }
      };

      for (const section of sections) {
        this.apiService.updateReviewCategory(batchId, donorId, {
          category: SECTION_TO_CATEGORY[section],
          isChecked: checks[section]
        }).pipe(takeUntil(this.destroy$))
          .subscribe({ next: () => checkDone(), error: () => checkDone() });
      }

      if (mergeFlag) {
        this.apiService.updateMergeFlag(batchId, donorId, {
          mergeFlag: mergeFlag as MergeFlag
        }).pipe(takeUntil(this.destroy$))
          .subscribe({ next: () => checkDone(), error: () => checkDone() });
      } else {
        checkDone();
      }
    });
  }

  // --- Create New Set ---

  private onRetrieveNewSet(): void {
    this.isLoading.set(true);

    this.apiService.createSet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const setId = response.data?.[0]?.setId;
          if (!setId) {
            this.isLoading.set(false);
            this.snackbarService.showError('Failed to generate new set ID');
            return;
          }

          this.newSetId.set(setId);
          this.isNewSetMode.set(true);
          this.hasRetrieved.set(true);
          this.isLoading.set(false);

          this.batchStatusControl.setValue('PENDG', { emitEvent: false });

          this.createSetRows = [];
          this.createSetRowCounter = 0;
          this.addCreateSetRow();
          this.addCreateSetRow();

          this.snackbarService.showSuccess(response.message || `New set ${setId} created`);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.snackbarService.showError(err?.displayMessage || 'Failed to create new set');
        }
      });
  }

  addCreateSetRow(): void {
    const form = this.fb.group({
      donorId: ['', Validators.required],
      mergeFlag: ['NOMER']
    });
    this.createSetRows = [...this.createSetRows, {
      id: ++this.createSetRowCounter,
      form,
      donorLoading: false,
      donorValid: null,
      donorData: null
    }];
  }

  removeCreateSetRow(index: number): void {
    this.createSetRows = this.createSetRows.filter((_, i) => i !== index);
    this.revalidateDuplicateDonorIds();
  }

  private revalidateDuplicateDonorIds(): void {
    for (let i = 0; i < this.createSetRows.length; i++) {
      const row = this.createSetRows[i];
      const donorId = row.form.get('donorId')?.value?.trim();
      if (!donorId || !row.errors?.['donorId']) continue;
      const isDuplicateError = row.errors['donorId'].includes('already exists in this set');
      if (!isDuplicateError) continue;
      const stillDuplicate = this.createSetRows.some((r, j) =>
        j !== i && r.form.get('donorId')?.value?.trim() === donorId
      );
      if (!stillDuplicate) {
        row.errors = {};
        row.donorValid = null;
        this.onDonorIdBlur(row, i);
      }
    }
  }

  onDonorIdBlur(row: CreateSetRow, index: number): void {
    const donorId = row.form.get('donorId')?.value?.trim();

    if (!donorId) {
      row.donorValid = null;
      row.donorData = null;
      row.errors = { donorId: 'This field is required and cannot be left blank.' };
      return;
    }

    row.errors = {};

    const duplicate = this.createSetRows.find((r, i) =>
      i !== index && r.form.get('donorId')?.value?.trim() === donorId
    );
    if (duplicate) {
      row.donorValid = false;
      row.donorData = null;
      this.snackbarService.showError(`Donor ${donorId} already exists in this set`);
      return;
    }

    row.donorLoading = true;
    row.donorValid = null;

    this.donorDemographicsService.getDemographics(donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (demo) => {
          row.donorLoading = false;
          row.donorValid = true;
          row.errors = {};
          row.donorData = {
            name: demo.header?.name || '',
            dob: this.formatDate(demo.header?.dateOfBirth || ''),
            gender: this.displaySex(demo.header?.sex || ''),
            address: `${demo.address?.streetName || ''} ${demo.address?.suiteApt || ''} ${demo.address?.city || ''} ${demo.address?.state || ''} ${demo.address?.zip || ''}`.trim(),
            workPhone: demo.phones?.work?.areaCode && demo.phones?.work?.phoneNo ? `${demo.phones.work.areaCode}-${demo.phones.work.phoneNo}` : '',
            homePhone: demo.phones?.home?.areaCode && demo.phones?.home?.phoneNo ? `${demo.phones.home.areaCode}-${demo.phones.home.phoneNo}` : ''
          };
        },
        error: (err) => {
          row.donorLoading = false;
          row.donorValid = false;
          row.donorData = null;
          this.snackbarService.showError(err?.error?.errorResponse?.error || err?.error?.message || `Donor ${donorId} does not exist`);
        }
      });
  }

  hasRowErrors(row: CreateSetRow): boolean {
    return !!row.errors && Object.keys(row.errors).some(k => !!row.errors![k]);
  }

  get hasCreateSetErrors(): boolean {
    return this.createSetRows.some(row => this.hasRowErrors(row));
  }

  onCreateSetAltAddressClick(event: Event, row: CreateSetRow): void {
    event.stopPropagation();
    const donorId = row.form.get('donorId')?.value?.trim();
    if (!donorId || !row.donorValid) return;

    const dialogData: AlternateDemographicsDialogData = {
      donorId: donorId,
      readOnly: true
    };

    this.dialog.open(AlternateDemographicsDialogComponent, {
      width: '700px',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'alt-address-side-panel',
      disableClose: false,
      data: dialogData
    });
  }

  isNewSetSaveEnabled(): boolean {
    return !this.isSavingNewSet() && !this.hasCreateSetErrors;
  }

  onSaveNewSet(): void {
    const setId = this.newSetId();
    if (!setId) return;

    let hasValidationError = false;
    for (const row of this.createSetRows) {
      const donorId = row.form.get('donorId')?.value?.trim();
      if (!donorId) {
        row.errors = { donorId: 'This field is required and cannot be left blank.' };
        hasValidationError = true;
      } else if (row.donorValid === false) {
        hasValidationError = true;
      } else if (row.donorValid === null) {
        hasValidationError = true;
      }
    }

    if (hasValidationError) {
      if (!this.hasCreateSetErrors) {
        this.snackbarService.showError('Please enter valid donor IDs for all rows');
      }
      return;
    }

    const validRows = this.createSetRows.filter(r => r.donorValid === true);
    if (validRows.length < 2) {
      this.snackbarService.showError('Minimum of two records required to create a new batch');
      return;
    }

    this.isSavingNewSet.set(true);

    let completedCalls = 0;
    let hasError = false;
    let lastSuccessMessage = '';
    const totalCalls = this.createSetRows.length;

    const checkDone = () => {
      completedCalls++;
      if (completedCalls >= totalCalls) {
        this.isSavingNewSet.set(false);
        if (!hasError) {
          this.snackbarService.showSuccess(lastSuccessMessage || `Set ${setId} saved with ${totalCalls} donors`);
          this.isNewSetMode.set(false);
          this.filterForm.patchValue({ batchId: setId });
          this.loadBatches();
          this.loadBatchDetails();
        }
      }
    };

    for (const row of this.createSetRows) {
      const donorId = row.form.get('donorId')?.value?.trim();
      if (!donorId) { checkDone(); continue; }

      this.apiService.addDonorToSet(setId, { donorId })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => { lastSuccessMessage = res?.message || lastSuccessMessage; checkDone(); },
          error: (err) => {
            if (!hasError) {
              hasError = true;
              this.snackbarService.showError(err?.displayMessage || `Failed to add donor ${donorId}`);
            }
            checkDone();
          }
        });
    }
  }

  onBatchStatusChange(value: string): void {
    if (value === 'INVAL') {
      this.onInvalidateBatch();
    }
  }

  private revertBatchStatus(): void {
    const currentStatus = this.batchDetails()?.batch?.setStatusCode || 'PENDG';
    this.batchStatusControl.setValue(currentStatus, { emitEvent: false });
  }

  onCommitInvestigation(): void {
    const batchId = this.filterForm.get('batchId')?.value;
    if (!batchId) return;

    const dialogData: ConfirmActionDialogData = {
      title: 'Commit Investigation',
      message: 'Are you sure you want to commit this investigation? This action cannot be undone.',
      confirmText: 'COMMIT',
      cancelText: 'CANCEL'
    };

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result === true) {
          this.performCommit(batchId);
        }
      });
  }

  private performCommit(batchId: string): void {
    this.isCommitting.set(true);

    if (this.hasLocalChanges()) {
      const donorId = this.getSelectedDonorId();
      if (!donorId) {
        this.isCommitting.set(false);
        return;
      }
      this.saveAndThenResolve(batchId, donorId);
    } else {
      this.callResolveApi(batchId);
    }
  }

  private saveAndThenResolve(batchId: string, donorId: string): void {
    const checks = this.localSectionChecks();
    const sections: InvestCheckSection[] = ['demographics', 'keydata', 'interdictions', 'donations', 'attributes'];

    let completedCalls = 0;
    let hasError = false;
    const totalCalls = sections.length + 1;

    const checkDone = () => {
      completedCalls++;
      if (completedCalls >= totalCalls) {
        if (!hasError) {
          this.hasLocalChanges.set(false);
          this.callResolveApi(batchId);
        } else {
          this.isCommitting.set(false);
        }
      }
    };

    for (const section of sections) {
      this.apiService.updateReviewCategory(batchId, donorId, {
        category: SECTION_TO_CATEGORY[section],
        isChecked: checks[section]
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => checkDone(),
          error: (err) => {
            if (!hasError) {
              hasError = true;
              this.snackbarService.showError(err?.displayMessage || INVEST_ERROR_MESSAGES.SAVE_ERROR);
            }
            checkDone();
          }
        });
    }

    const mergeFlag = this.localMergeFlag();
    if (mergeFlag) {
      this.apiService.updateMergeFlag(batchId, donorId, {
        mergeFlag: mergeFlag as MergeFlag
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => checkDone(),
          error: (err) => {
            if (!hasError) {
              hasError = true;
              this.snackbarService.showError(err?.displayMessage || INVEST_ERROR_MESSAGES.MERGE_FLAG_ERROR);
            }
            checkDone();
          }
        });
    } else {
      checkDone();
    }
  }

  private callResolveApi(batchId: string): void {
    this.apiService.resolveSet(batchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isCommitting.set(false);
          this.snackbarService.showSuccess(res?.message || 'Duplicate set resolved successfully');
          this.loadBatchDetails();
        },
        error: (err) => {
          this.isCommitting.set(false);
          this.snackbarService.showError(err?.displayMessage || INVEST_ERROR_MESSAGES.RESOLVE_ERROR);
        }
      });
  }

  onInvalidateBatch(): void {
    const batchId = this.filterForm.get('batchId')?.value;
    if (!batchId) return;

    const dialogData: ConfirmActionDialogData = {
      title: 'Invalidate Batch',
      message: 'Are you sure you want to invalidate this batch?',
      confirmText: 'INVALIDATE',
      cancelText: 'CANCEL'
    };

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result === true) {
          this.performInvalidate(batchId);
        } else {
          this.revertBatchStatus();
        }
      });
  }

  private performInvalidate(batchId: string): void {
    this.apiService.updateSetStatus(batchId, { statusCode: 'INVAL' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.snackbarService.showSuccess(res?.message || 'Set status updated successfully');
          this.resetComponent();
          this.loadBatches();
        },
        error: (err) => {
          this.snackbarService.showError(err?.displayMessage || INVEST_ERROR_MESSAGES.INVALIDATE_ERROR);
        }
      });
  }

  getReviewStatus(section: InvestCheckSection): { checked: boolean; user: string; date: string } | null {
    const localMeta = this.localCheckMeta()[section];
    if (this.localSectionChecks()[section] && localMeta) {
      return { checked: true, user: localMeta.user, date: localMeta.date };
    }

    const donorId = this.selectedDonor()?.donorId;
    if (!donorId) return null;
    const donor = this.donors().find(d => d.donorId === donorId);
    if (!donor) return null;

    const review = donor[section];
    if (!review || review.isChecked !== 'Y') return null;

    return {
      checked: true,
      user: review.reviewUserName || '',
      date: review.reviewDate ? this.formatDateTime(review.reviewDate) : ''
    };
  }

  getVisitStatus(section: InvestCheckSection): string {
    const checks = this.localSectionChecks();
    if (checks[section]) return 'Checked';

    if (this.visitedSections()[section]) return 'Visited';

    const donorId = this.selectedDonor()?.donorId;
    if (!donorId) return 'Not Visited';
    const donor = this.donors().find(d => d.donorId === donorId);
    if (!donor) return 'Not Visited';

    const review = donor[section];
    if (review?.isChecked === 'Y') return 'Checked';
    if (review?.reviewDate) return 'Visited';
    return 'Not Visited';
  }

  isCheckboxDisabled(section: InvestCheckSection): boolean {
    return this.getVisitStatus(section) === 'Not Visited';
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

  isInvestigationPending(donorId: string): boolean {
    const donor = this.donors().find(d => d.donorId === donorId);
    if (!donor) return true;
    const sections: InvestCheckSection[] = ['demographics', 'keydata', 'interdictions', 'donations', 'attributes'];
    return sections.some(s => donor[s]?.isChecked !== 'Y');
  }

  getSelectedDonorField(field: string): string {
    const donor = this.donors().find(d => d.donorId === this.currentCheckDonorId());
    if (!donor) return '';
    switch (field) {
      case 'dateOfBirth': return this.formatDate(donor.dateOfBirth);
      case 'sex': return this.displaySex(donor.gender);
      default: return '';
    }
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

  showTooltipIfOverflowing(element: HTMLElement, tooltip: MatTooltip): void {
    tooltip.disabled = element.scrollWidth <= element.clientWidth;
  }

  private getSelectedDonorId(): string {
    return this.selectedDonor()?.donorId || (this.tableData().length > 0 ? this.tableData()[0].donorId : '');
  }

  private getChapterNow(): moment.Moment {
    const tz = this.headerService.chapterTimeZone();
    if (!tz || tz === 'UTC') return moment();
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(new Date());
      const get = (t: string) => parseInt(parts.find(p => p.type === t)!.value, 10);
      return moment([get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')]);
    } catch {
      return moment();
    }
  }

  private resetComponent(): void {
    this.filterForm.reset({ batchId: '' });
    this.batches.set([]);
    this.filteredBatches = [];
    this.batchDetails.set(null);
    this.donors.set([]);
    this.hasRetrieved.set(false);
    this.isLoading.set(false);
    this.sidePanelOpen.set(false);
    this.selectedDonor.set(null);
    this.resetLocalState();
  }

  get f() {
    return this.filterForm.controls;
  }
}
