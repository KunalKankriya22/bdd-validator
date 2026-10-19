/**
 * Contract Profile Test Query Component
 *
 * JIRA: MLT-13695
 * Mnemonic: RGPROFQ
 * FMB File: rgqtests
 *
 * Technical Analysis: See RGQTESTS_FMB_Technical_Analysis.md in API project
 * Location: BM.BloodCenters.API/Src/BM.BloodCenters.API/RGQTESTS_FMB_Technical_Analysis.md
 *
 * Purpose: Query and view contract profile tests for Reference Lab (RG) contracts.
 * Allows users to select a contract and profile set, then view all tests associated
 * with a specific profile sequence or all sequences.
 *
 * Business Rules (from FMB analysis):
 * - BR-001: Contract type must be 'RG' (Reference Lab) - enforced by API
 * - BR-002: Contract must be authorized for user's chapter - enforced by API
 * - BR-003: Contract must be active (current date within eff_date/term_date) - enforced by API
 * - BR-004: Profile Set must be active for selected contract
 * - BR-005: Profile Sequence is optional - if blank, shows all sequences
 * - BR-006: Profile Sequence dropdown populated from 1 to MaxProfileSeqNo
 *
 * Route: /laboratory-functions/sample-management/regional-sample-tracking/
 *        regional-sample-tracking-queries/contract-profile-test-query
 */

import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil, startWith, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '@shared/components/data-table/data-table';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';

import { ContractProfileTestQueryApiService } from './services/contract-profile-test-query-api.service';
import {
  ContractOption,
  ProfileSetOption,
  ContractProfileTest,
  ContractProfileTestQueryRequest
} from './models/contract-profile-test-query.model';
import moment from 'moment';

@Component({
  selector: 'app-contract-profile-test-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
  ],
  templateUrl: './contract-profile-test-query.html',
  styleUrl: './contract-profile-test-query.scss',
})
export class ContractProfileTestQuery implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly apiService = inject(ContractProfileTestQueryApiService);
  private readonly snackbarService = inject(SnackbarService);

  headerConfig = computed<PageHeaderConfig>(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    if (pageData) {
      return {
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: pageData.title, link: null },
        ],
        title: pageData.title,
        subtitle: pageData.subtitle || '',
      };
    }
    return {
      breadcrumbs: [{ label: 'Home', link: '/home' }],
      title: '',
      subtitle: '',
    };
  });

  searchForm!: FormGroup;
  dataSource: ContractProfileTest[] = [];
  isLoading = false;
  hasSearched = false;

  // Contract dropdown state
  readonly contracts = signal<ContractOption[]>([]);
  readonly contractsLoading = signal<boolean>(false);
  readonly contractDescription = signal<string>('');

  // Profile Set dropdown state
  readonly profileSets = signal<ProfileSetOption[]>([]);
  readonly profileSetsLoading = signal<boolean>(false);
  readonly profileDescription = signal<string>('');

  // Profile Sequence dropdown state
  readonly profileSequences = signal<number[]>([]);
  readonly maxProfileSeqNo = signal<number | null>(null);

  // Search controls for searchable dropdowns
  contractSearchCtrl = new FormControl('');
  contractSearchSignal = toSignal(this.contractSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  profileSetSearchCtrl = new FormControl('');
  profileSetSearchSignal = toSignal(this.profileSetSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  profileSeqSearchCtrl = new FormControl('');
  profileSeqSearchSignal = toSignal(this.profileSeqSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  // Filtered dropdown options
  filteredContracts = computed(() => {
    const searchTerm = this.contractSearchSignal()?.toLowerCase() || '';
    const options = this.contracts();
    if (!searchTerm) return options;
    return options.filter(o =>
      o.contractId.toLowerCase().includes(searchTerm) ||
      o.company.toLowerCase().includes(searchTerm)
    );
  });

  filteredProfileSets = computed(() => {
    const searchTerm = this.profileSetSearchSignal()?.toLowerCase() || '';
    const options = this.profileSets();
    if (!searchTerm) return options;
    return options.filter(o =>
      o.profileSetId.toLowerCase().includes(searchTerm) ||
      (o.profileDesc?.toLowerCase().includes(searchTerm) ?? false)
    );
  });

  filteredProfileSequences = computed(() => {
    const searchTerm = this.profileSeqSearchSignal()?.toLowerCase() || '';
    const sequences = this.profileSequences();
    if (!searchTerm) return sequences;
    return sequences.filter(seq => seq.toString().includes(searchTerm));
  });

  tableConfig: DataTableConfig<ContractProfileTest> = {
    columns: [
      { key: 'profileSeqNo', header: 'Profile Sequence', sortable: false },
      { key: 'testId', header: 'Test ID', sortable: true },
      { key: 'testDesc', header: 'Description', valueFormatter: (v: string) => v || '-' },
      {
        key: 'stopLabelFlag',
        header: 'Extract?',
        valueFormatter: (v: string) => v === 'Y' ? 'YES' : 'NO'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        valueFormatter: (v: string) => v || '-'
      },
    ],
    pagination: {
      pageSize: 25,
      totalRecords: 0,
      pageIndex: 0,
      pageSizeOptions: [10, 25, 50, 100],
    },
    sortConfig: { column: 'profileSeqNo', direction: 'D' },
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'No contract profile tests found for the selected criteria',
    noDataIcon: 'edit',
    enableRowHighlight: false,
    showActionsAsMenu: false,
  };

  private requestState: ContractProfileTestQueryRequest = {
    contractId: '',
    profileSetId: '',
    profileSeqNo: null,
    take: 25,
    skip: 0,
    sortColumn: 'profileSeqNo',
    sortDirection: 'D',
  };

  private take = 25;
  private skip = 0;

  get isRetrieveDisabled(): boolean {
    return this.isLoading || !this.searchForm.valid;
  }

  get isClearAllDisabled(): boolean {
    return !this.searchForm.dirty &&
           !this.searchForm.get('contractId')?.value &&
           !this.searchForm.get('profileSetId')?.value &&
           !this.searchForm.get('profileSeqNo')?.value &&
           !this.hasSearched;
  }

  ngOnInit(): void {
    this.initSearchForm();
    this.loadContracts();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initSearchForm(): void {
    this.searchForm = this.fb.group({
      contractId: ['', Validators.required],
      profileSetId: [{ value: '', disabled: true }, Validators.required],
      profileSeqNo: [{ value: null, disabled: true }],
    });
  }

  private setupFormListeners(): void {
    // Contract ID change: load profile sets
    this.searchForm.get('contractId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((contractId: string) => {
        this.onContractChange(contractId);
      });

    // Profile Set ID change: validate and load profile sequences
    this.searchForm.get('profileSetId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((profileSetId: string) => {
        this.onProfileSetChange(profileSetId);
      });
  }

  private loadContracts(searchText?: string): void {
    this.contractsLoading.set(true);
    this.apiService.getContractLookup(searchText)
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => {
          this.contractsLoading.set(false);
          this.snackbarService.showError('Failed to load contracts');
          return of({ success: false, data: [] } as any);
        })
      )
      .subscribe(response => {
        this.contractsLoading.set(false);
        if (response.success) {
          this.contracts.set(response.data);
        }
      });
  }

  private onContractChange(contractId: string): void {
    // Reset dependent fields
    this.profileSets.set([]);
    this.profileSequences.set([]);
    this.contractDescription.set('');
    this.profileDescription.set('');
    this.maxProfileSeqNo.set(null);
    this.searchForm.get('profileSetId')?.reset();
    this.searchForm.get('profileSeqNo')?.reset();
    this.searchForm.get('profileSetId')?.disable();
    this.searchForm.get('profileSeqNo')?.disable();
    this.hasSearched = false;
    this.dataSource = [];

    if (!contractId) return;

    // Find selected contract and set description
    const selectedContract = this.contracts().find(c => c.contractId === contractId);
    if (selectedContract) {
      this.contractDescription.set(selectedContract.company);
    }

    // Load profile sets
    this.loadProfileSets(contractId);
  }

  private loadProfileSets(contractId: string): void {
    this.profileSetsLoading.set(true);
    this.apiService.getProfileSetLookup(contractId)
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => {
          this.profileSetsLoading.set(false);
          this.snackbarService.showError('Failed to load profile sets');
          return of({ success: false, data: [] } as any);
        })
      )
      .subscribe(response => {
        this.profileSetsLoading.set(false);
        if (response.success && response.data.length > 0) {
          this.profileSets.set(response.data);
          this.searchForm.get('profileSetId')?.enable();
        } 
      });
  }

  private onProfileSetChange(profileSetId: string): void {
    // Reset dependent fields
    this.profileSequences.set([]);
    this.profileDescription.set('');
    this.maxProfileSeqNo.set(null);
    this.searchForm.get('profileSeqNo')?.reset();
    this.searchForm.get('profileSeqNo')?.disable();
    this.hasSearched = false;
    this.dataSource = [];

    if (!profileSetId) return;

    const contractId = this.searchForm.get('contractId')?.value;
    if (!contractId) return;

    // Validate profile set
    this.validateProfileSet(contractId, profileSetId);
  }

  private validateProfileSet(contractId: string, profileSetId: string): void {
    this.apiService.validateProfileSet({ contractId, profileSetId })
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          const errorCode = error?.error?.errorCode || error?.error?.ErrorCode;
          const errorMessage = error?.error?.message || error?.error?.Error || 'Invalid Profile Set ID';
          const displayMsg = errorCode ? `${errorCode}: ${errorMessage}` : errorMessage;
          this.snackbarService.showError(displayMsg);
          return of({ success: false } as any);
        })
      )
      .subscribe(response => {
        if (response.success && response.data.isValid) {
          this.profileDescription.set(response.data.profileDesc || '');
          this.maxProfileSeqNo.set(response.data.maxProfileSeqNo || null);

          // Populate profile sequence dropdown (1 to maxProfileSeqNo)
          if (response.data.maxProfileSeqNo) {
            const sequences = Array.from(
              { length: response.data.maxProfileSeqNo },
              (_, i) => i + 1
            );
            this.profileSequences.set(sequences);
          }

          this.searchForm.get('profileSeqNo')?.enable();
        }
      });
  }

  onRetrieve(): void {
    if (!this.searchForm.valid || this.isLoading) return;

    this.isLoading = true;
    this.hasSearched = true;
    this.skip = 0;

    const formValues = this.searchForm.getRawValue();
    this.requestState = {
      contractId: formValues.contractId,
      profileSetId: formValues.profileSetId,
      profileSeqNo: formValues.profileSeqNo || null,
      take: this.take,
      skip: this.skip,
      sortColumn: this.tableConfig.sortConfig?.column || 'profileSeqNo',
      sortDirection: this.tableConfig.sortConfig?.direction || 'D',
    };

    this.executeQuery();
  }

  private executeQuery(): void {
    this.apiService.getContractProfileTests(this.requestState)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          this.isLoading = false;
          const errorCode = error?.error?.errorCode || error?.error?.ErrorCode;
          const errorMessage = error?.error?.message || error?.error?.Error || 'Failed to retrieve contract profile tests';
          const displayMsg = errorCode ? `${errorCode}: ${errorMessage}` : errorMessage;
          this.snackbarService.showError(displayMsg);
          return of({ success: false, data: [], totalCount: 0 } as any);
        })
      )
      .subscribe(response => {
        this.isLoading = false;
        if (response.success) {
          this.dataSource = response.data;
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.totalCount || 0;
            this.tableConfig.pagination.pageIndex = response.totalCount > 0 ? Math.floor(this.skip / this.take) : 0;
          }
        }
      });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.take = event.pageSize;
    this.skip = event.pageIndex * event.pageSize;
    this.requestState.take = this.take;
    this.requestState.skip = this.skip;
    this.isLoading = true;
    this.executeQuery();
  }

  onSortChange(event: { column: string; direction: 'A' | 'D' | 'default' }): void {
    if (event.direction === 'default') {
      return; // Skip query if direction is default
    }
    this.tableConfig.sortConfig = event;
    this.requestState.sortColumn = event.column;
    this.requestState.sortDirection = event.direction;
    this.isLoading = true;
    this.executeQuery();
  }

  onClearAll(): void {
    this.searchForm.reset();
    this.contractSearchCtrl.reset();
    this.profileSetSearchCtrl.reset();
    this.contracts.set([]);
    this.profileSets.set([]);
    this.profileSequences.set([]);
    this.contractDescription.set('');
    this.profileDescription.set('');
    this.maxProfileSeqNo.set(null);
    this.dataSource = [];
    this.hasSearched = false;
    this.searchForm.get('profileSetId')?.disable();
    this.searchForm.get('profileSeqNo')?.disable();

    // Reload contracts
    this.loadContracts();
  }
}
