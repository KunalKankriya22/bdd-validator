import { Component, OnInit, OnDestroy, ViewChild, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormGroupDirective, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { LoginService } from '@shared/services/login.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ConfirmActionDialogComponent,
  ConfirmActionDialogData,
} from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

import { ReagentKitNoPreQualificationService } from './services/reagent-kit-no-pre-qualification.service';
import {
  TestIdOption,
  TestKitDetailDto,
  ReagentDetailDto,
  ReagentLovDto,
  TestKitItem,
  ReagentDetailRow,
  CreateTestKitRequest,
  CreateReagentRequest,
  UpdateTestKitRequest,
} from './models/reagent-kit-no-pre-qualification.model';

@Component({
  selector: 'app-reagent-kit-no-pre-qualification',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
  ],
  templateUrl: './reagent-kit-no-pre-qualification.html',
  styleUrls: ['./reagent-kit-no-pre-qualification.scss'],
})
export class ReagentKitNoPreQualificationComponent implements OnInit, OnDestroy {
  @ViewChild(FormGroupDirective) private formDirective!: FormGroupDirective;
  @ViewChild(SearchBar) private searchBarComponent!: SearchBar;

  private readonly service = inject(ReagentKitNoPreQualificationService);
  private readonly fb = inject(FormBuilder);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly loginService = inject(LoginService);
  private readonly apiService = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
    ],
  };

  private readonly pageHeaderEffect = effect(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    if (pageData) {
      this.pageHeaderConfig = {
        ...this.pageHeaderConfig,
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: pageData.title, link: null },
        ],
        title: pageData.title,
        subtitle: pageData.subtitle || '',
      };
    }
  });

  // Form
  filterForm!: FormGroup;
  protected readonly formDirty = signal(false);

  // Dropdown data
  protected readonly testIds = signal<TestIdOption[]>([]);
  protected readonly loadingTestIds = signal<boolean>(false);

  // Search controls for dropdowns
  protected readonly expiredSearchControl = new FormControl('');
  protected readonly testIdSearchControl = new FormControl('');
  private readonly expiredSearch = signal('');
  private readonly testIdSearch = signal('');

  // Track selected values for display
  private readonly selectedExpiredValue = signal<string | null>(null);
  private readonly selectedTestIdValue = signal<string | null>(null);

  // Truncation state
  protected isExpiredTruncated = false;
  protected isTestIdTruncated = false;

  // Show Expired options (Y/N per FMB BR-030)
  readonly showExpiredOptions = [
    { value: 'N', label: 'No' },
    { value: 'Y', label: 'Yes' },
  ];

  // Reagent Type options (R/C/K per FMB BR-019)
  readonly reagentTypeOptions = [
    { value: 'R', label: 'R- Reagent' },
    { value: 'C', label: 'C - Control' },
    { value: 'K', label: 'K - Kit' },
  ];

  // License Flag options (A/L/U per FMB BR-014)
  readonly licenseFlagOptions = [
    { value: 'L', label: 'Licensed' },
    { value: 'A', label: 'Approved' },
    { value: 'U', label: 'Unapproved' },
  ];

  // Filtered dropdown options (computed)
  protected readonly filteredExpiredOptions = computed(() => {
    const search = this.expiredSearch().toLowerCase();
    if (!search) return this.showExpiredOptions;
    return this.showExpiredOptions.filter(o =>
      o.label.toLowerCase().includes(search) || o.value.toLowerCase().includes(search)
    );
  });

  protected readonly filteredTestIds = computed(() => {
    const search = this.testIdSearch().toLowerCase();
    const options = this.testIds();
    if (!search) return options;
    return options.filter(o =>
      (o.testId || '').toLowerCase().includes(search) ||
      (o.testDescription || '').toLowerCase().includes(search)
    );
  });

  // Display values for mat-select-trigger
  protected readonly selectedExpiredDisplay = computed(() => {
    const val = this.selectedExpiredValue();
    if (!val) return '';
    const option = this.showExpiredOptions.find(o => o.value === val);
    return option?.label || val;
  });

  protected readonly selectedTestIdDisplay = computed(() => {
    const val = this.selectedTestIdValue();
    if (!val) return '';
    const testId = this.testIds().find(t => t.testId === val);
    if (!testId) return val;
    return testId.testDescription ? `${testId.testId} - ${testId.testDescription}` : testId.testId;
  });

  // Test Description auto-populated from Test ID
  protected readonly selectedTestDescription = computed(() => {
    const val = this.selectedTestIdValue();
    if (!val) return '';
    const testId = this.testIds().find(t => t.testId === val);
    return testId?.testDescription || '';
  });

  // Test Kit data from API
  protected readonly testKitList = signal<TestKitDetailDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly hasSearched = signal<boolean>(false);

  // Master-detail state
  protected readonly selectedKitId = signal<string | null>(null);
  private readonly kitSearchText = signal('');

  // Create New Test Kit mode
  protected readonly isCreateMode = signal(false);
  protected newKitQcExpiration = new FormControl<Date | null>(null);
  protected newKitLicenseFlag = new FormControl('');

  // AG/MAG test group state (BR-013)
  protected readonly isAgMagTest = signal(false);

  // Editable reagent rows for detail panel
  protected readonly reagentRows = signal<ReagentDetailRow[]>([]);

  // Reagent LOV data per row index
  protected readonly reagentLovMap = signal<Map<number, ReagentLovDto[]>>(new Map());

  // Per-row search controls and text for Reagent Name dropdown
  private readonly reagentNameSearchControls = new Map<number, FormControl>();
  private readonly reagentNameSearchText = signal<Map<number, string>>(new Map());

  // Track if detail panel has unsaved changes
  protected readonly detailDirty = signal(false);

  // Saving state
  protected readonly saving = signal(false);

  // Lab code '99' access restriction (Gap 3.2)
  protected readonly formAccessDenied = signal(false);

  // Search bar config
  searchConfig: SearchBarConfig = {
    placeholder: 'Search',
    minLength: 1,
    ariaLabel: 'Search test kits',
    debounceTime: 300,
    searchOnEnterOnly: false,
  };

  // Derive unique test kit items for left panel
  protected readonly testKitItems = computed<TestKitItem[]>(() => {
    const kits = this.testKitList();
    const search = this.kitSearchText().toLowerCase();

    let items: TestKitItem[] = kits.map(kit => ({
      kitId: kit.testKitId,
      qcExpiration: kit.qcExpiryDate || '',
      licenseFlag: kit.apprLicFlag || '',
    }));

    if (search) {
      items = items.filter(item =>
        item.kitId.toLowerCase().includes(search)
      );
    }

    return items;
  });

  // License flag display mapping
  protected getLicenseFlagDisplay(flag: string): string {
    if (!flag) return '-';
    switch (flag.toUpperCase()) {
      case 'L': return 'Licensed';
      case 'A': return 'Approved';
      case 'U': return 'Unapproved';
      default: return flag;
    }
  }

  // Reagent type display mapping
  protected getReagentTypeDisplay(type: string): string {
    const opt = this.reagentTypeOptions.find(o => o.value === type);
    return opt?.label || type;
  }

  get f() {
    return this.filterForm.controls;
  }

  ngOnInit(): void {
    this.initForm();
    this.setupSearchListeners();
    this.loadTestIds();
    this.subscribeToChapterChanges();
    this.loadUserLabCode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      showExpired: ['', Validators.required],
      testId: ['', Validators.required],
    });

    this.filterForm.get('showExpired')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        this.selectedExpiredValue.set(val);
      });

    this.filterForm.get('testId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        this.selectedTestIdValue.set(val);
        if (val) {
          this.checkTestGroup(val);
        }
      });

    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.formDirty.set(this.filterForm.dirty));
  }

  private setupSearchListeners(): void {
    this.expiredSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => this.expiredSearch.set(val || ''));

    this.testIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => this.testIdSearch.set(val || ''));
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.onClearAll();
      this.loadTestIds();
    });
  }

  private loadUserLabCode(): void {
    const userId = this.loginService.getStoredUsername();
    if (!userId) return;

    this.apiService.get<any>(API.SYSTEM_USERS.GET_USER(userId))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const user = response?.item || response;
          const labCode = user?.labCode || user?.testinG_LAB_CODE || '';
          if (labCode === '99') {
            this.formAccessDenied.set(true);
            this.filterForm.disable();
            this.snackbarService.showError('Access denied: Users with testing lab code 99 cannot access this form.');
          }
        },
      });
  }

  private loadTestIds(): void {
    this.loadingTestIds.set(true);
    this.service
      .getValidTests()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingTestIds.set(false))
      )
      .subscribe({
        next: (testIds) => {
          this.testIds.set(testIds);
        },
        error: () => {
          this.testIds.set([]);
          this.snackbarService.showError('Failed to load test IDs.');
        },
      });
  }

  private checkTestGroup(testId: string): void {
    this.service
      .getTestGroup(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isAgMagTest.set(result.isAgMag || !!result.requiresApprovalLicense);
        },
        error: () => {
          this.isAgMagTest.set(false);
        },
      });
  }

  // Truncation checks for tooltips
  protected checkExpiredTruncation(el: HTMLElement): void {
    this.isExpiredTruncated = el.scrollWidth > el.clientWidth;
  }

  protected checkTestIdTruncation(el: HTMLElement): void {
    this.isTestIdTruncated = el.scrollWidth > el.clientWidth;
  }

  onRetrieve(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }

    const { showExpired, testId } = this.filterForm.value;

    this.loading.set(true);
    this.error.set(null);
    this.hasSearched.set(true);
    this.selectedKitId.set(null);
    this.kitSearchText.set('');
    this.isCreateMode.set(false);
    this.reagentRows.set([]);
    this.detailDirty.set(false);
    this.searchBarComponent?.clearSearch();

    this.service
      .getTestKits(testId, showExpired)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (kits) => {
          this.testKitList.set(kits);
          if (kits.length > 0) {
            this.selectKit(kits[0].testKitId);
          }
        },
        error: (err) => {
          const errorMessage = err?.error?.errorResponse?.error || 'Failed to retrieve reagent kits.';
          this.snackbarService.showError(errorMessage);
          this.testKitList.set([]);
        },
      });
  }

  private selectKit(kitId: string): void {
    this.selectedKitId.set(kitId);
    this.isCreateMode.set(false);
    this.detailDirty.set(false);
    this.loadReagentsForKit(kitId);
  }

  private loadReagentsForKit(kitId: string): void {
    const testId = this.filterForm.get('testId')?.value;
    if (!testId) return;

    this.service
      .getReagents(kitId, testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reagents) => {
          const rows: ReagentDetailRow[] = reagents.map(r => ({
            reagentType: r.reagentType,
            name: r.reagentName,
            supplier: r.supplierCode,
            lotNo: r.lotNumber,
            expirationDate: r.expiryDate || '',
            isNew: false,
            reagentCode: r.reagentCode,
          }));
          this.reagentRows.set(rows);
        },
        error: () => {
          this.reagentRows.set([]);
          this.snackbarService.showError('Failed to load reagent details.');
        },
      });
  }

  // Kit search from search bar
  onKitSearch(searchText: string): void {
    this.kitSearchText.set(searchText);
    const items = this.testKitItems();
    if (items.length > 0 && (!this.selectedKitId() || !items.find(i => i.kitId === this.selectedKitId()))) {
      this.selectKit(items[0].kitId);
    } else if (items.length === 0) {
      this.selectedKitId.set(null);
      this.reagentRows.set([]);
    }
  }

  // Kit selection from left panel
  onKitSelected(kit: TestKitItem): void {
    this.selectKit(kit.kitId);
  }

  isKitSelected(kit: TestKitItem): boolean {
    return !this.isCreateMode() && this.selectedKitId() === kit.kitId;
  }

  // Create New Test Kit
  onCreateNewTestKit(): void {
    this.isCreateMode.set(true);
    this.selectedKitId.set(null);
    this.newKitQcExpiration.reset();
    this.newKitLicenseFlag.reset();
    this.reagentRows.set([{ reagentType: '', name: '', supplier: '', lotNo: '', expirationDate: '', isNew: true }]);
    this.reagentLovMap.set(new Map());
    this.clearReagentNameSearch();
    this.detailDirty.set(false);
  }

  // Add New Reagent row (only for new kits - BR-026)
  onAddNewReagent(): void {
    const current = this.reagentRows();
    this.reagentRows.set([...current, { reagentType: '', name: '', supplier: '', lotNo: '', expirationDate: '', isNew: true }]);
    this.detailDirty.set(true);
  }

  // Reagent Type change → load reagent LOV for that row
  onReagentTypeChange(index: number, value: string): void {
    const rows = [...this.reagentRows()];
    rows[index] = { ...rows[index], reagentType: value, name: '', supplier: '', lotNo: '', expirationDate: '', reagentCode: '', reagentId: '', kitLotNumber: '' };
    this.reagentRows.set(rows);
    this.clearReagentNameSearch(index);
    this.detailDirty.set(true);

    const testId = this.filterForm.get('testId')?.value;
    if (testId && value) {
      this.service
        .getReagentLov(testId, value)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (lovData) => {
            const currentMap = new Map(this.reagentLovMap());
            currentMap.set(index, lovData);
            this.reagentLovMap.set(currentMap);
          },
          error: () => {
            const currentMap = new Map(this.reagentLovMap());
            currentMap.set(index, []);
            this.reagentLovMap.set(currentMap);
          },
        });
    }
  }

  // Reagent Name change → auto-populate supplier, lot, expiry from LOV
  onReagentNameChange(index: number, reagentId: string): void {
    const lovOptions = this.reagentLovMap().get(index) || [];
    const selected = lovOptions.find(r => r.reagentId === reagentId);

    const rows = [...this.reagentRows()];
    if (selected) {
      rows[index] = {
        ...rows[index],
        name: selected.reagentName,
        supplier: selected.supplierCode,
        lotNo: selected.lotNumber,
        expirationDate: selected.expiryDate,
        reagentCode: selected.reagentCode,
        reagentId: selected.reagentId,
        kitLotNumber: selected.kitLotNumber,
        isNew: rows[index].isNew,
      };

      // BR-023: Warn if reagent is expired
      if (selected.expiryDate && moment(selected.expiryDate).isBefore(moment())) {
        this.snackbarService.showError('Warning: Selected reagent is expired.');
      }
    } else {
      rows[index] = { ...rows[index], reagentId: reagentId };
    }
    this.reagentRows.set(rows);
    this.detailDirty.set(true);
  }

  // Get reagent LOV options for a specific row
  protected getReagentLovForRow(index: number): ReagentLovDto[] {
    return this.reagentLovMap().get(index) || [];
  }

  // Return (or lazily create) the search FormControl for a given row
  protected getReagentNameSearchControl(index: number): FormControl {
    if (!this.reagentNameSearchControls.has(index)) {
      const ctrl = new FormControl('');
      ctrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
        const current = new Map(this.reagentNameSearchText());
        current.set(index, val || '');
        this.reagentNameSearchText.set(current);
      });
      this.reagentNameSearchControls.set(index, ctrl);
    }
    return this.reagentNameSearchControls.get(index)!;
  }

  // Filtered LOV for Reagent Name dropdown (reacts to reagentNameSearchText signal)
  protected getFilteredReagentNamesForRow(index: number): ReagentLovDto[] {
    const lov = this.reagentLovMap().get(index) || [];
    const search = (this.reagentNameSearchText().get(index) || '').toLowerCase();
    if (!search) return lov;
    return lov.filter(r =>
      (r.reagentId || '').toLowerCase().includes(search) ||
      (r.reagentName || '').toLowerCase().includes(search)
    );
  }

  private clearReagentNameSearch(index?: number): void {
    if (index !== undefined) {
      this.reagentNameSearchControls.get(index)?.setValue('', { emitEvent: false });
      const current = new Map(this.reagentNameSearchText());
      current.delete(index);
      this.reagentNameSearchText.set(current);
    } else {
      this.reagentNameSearchControls.forEach(ctrl => ctrl.setValue('', { emitEvent: false }));
      this.reagentNameSearchControls.clear();
      this.reagentNameSearchText.set(new Map());
    }
  }

  // Save handler
  onSave(): void {
    if (this.saving()) return;

    if (this.isCreateMode()) {
      this.saveNewTestKit();
    } else if (this.selectedKitId()) {
      this.updateExistingTestKit();
    }
  }

  private saveNewTestKit(): void {
    const testId = this.filterForm.get('testId')?.value;
    const showExpired = this.filterForm.get('showExpired')?.value;
    const rows = this.reagentRows();

    // Validate reagent rows
    const invalidRows = rows.filter(r => !r.reagentType || !r.name || !r.expirationDate);
    if (invalidRows.length > 0) {
      this.snackbarService.showError('All reagent rows must have Type, Name, and Expiration Date.');
      return;
    }

    // BR-013: Validate license flag for AG/MAG tests
    if (this.isAgMagTest() && !this.newKitLicenseFlag.value) {
      this.snackbarService.showError('License Flag is required for AG/MAG tests.');
      return;
    }

    const reagents: CreateReagentRequest[] = rows.map(r => ({
      reagentType: r.reagentType,
      reagentName: r.name,
      reagentCode: r.reagentCode || '',
      reagentId: r.reagentId || '',
      supplierCode: r.supplier,
      lotNumber: r.lotNo,
      expiryDate: r.expirationDate,
      kitLotNumber: r.kitLotNumber,
    }));

    if (this.newKitQcExpiration.hasError('matDatepickerParse') || this.newKitQcExpiration.hasError('invalidDate')) {
      this.snackbarService.showError('Invalid date format.');
      return;
    }

    if (this.newKitQcExpiration.value) {
      const qcDate = moment(this.newKitQcExpiration.value);
      if (qcDate.isBefore(moment().startOf('day'))) {
        this.snackbarService.showError('QC Expiration Date cannot be in the past.');
        return;
      }
    }

    const request: CreateTestKitRequest = {
      testId,
      showExpired,
      reagents,
    };

    if (this.newKitQcExpiration.value) {
      request.qcExpiryDate = moment(this.newKitQcExpiration.value).toISOString();
    }

    if (this.newKitLicenseFlag.value) {
      request.apprLicFlag = this.newKitLicenseFlag.value;
    }

    this.saving.set(true);
    this.service
      .createTestKit(request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess('Test kit created successfully.');
          this.detailDirty.set(false);
          this.onRetrieve();
        },
        error: (err) => {
          const errorMessage = err?.error?.errorResponse?.error || 'Failed to create test kit.';
          this.snackbarService.showError(errorMessage);
        },
      });
  }

  private updateExistingTestKit(allowExpiredReagent = false): void {
    const kitId = this.selectedKitId();
    if (!kitId) return;

    const newRows = this.reagentRows().filter(r => r.isNew);

    const invalidRows = newRows.filter(r => !r.reagentType || !r.name || !r.expirationDate);
    if (invalidRows.length > 0) {
      this.snackbarService.showError('All new reagent rows must have Type, Name, and Expiration Date.');
      return;
    }

    const reagents: CreateReagentRequest[] | undefined = newRows.length > 0
      ? newRows.map(r => ({
          reagentType: r.reagentType,
          reagentName: r.name,
          reagentCode: r.reagentCode || '',
          reagentId: r.reagentId || '',
          supplierCode: r.supplier,
          lotNumber: r.lotNo,
          expiryDate: r.expirationDate,
          kitLotNumber: r.kitLotNumber,
        }))
      : undefined;

    const request: UpdateTestKitRequest = { allowExpiredReagent };
    if (reagents) {
      request.reagents = reagents;
    }

    this.saving.set(true);
    this.service
      .updateTestKit(kitId, request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: (response) => {
          if (!response.success && response.errorResponse?.errorCode === '0224') {
            this.showExpiredReagentWarning(() => this.updateExistingTestKit(true));
            return;
          }
          if (!response.success) {
            const errorMessage = response.errorResponse?.error || response.message || 'Failed to update test kit.';
            this.snackbarService.showError(errorMessage);
            return;
          }
          this.snackbarService.showSuccess('Test kit updated successfully.');
          this.detailDirty.set(false);
          this.loadReagentsForKit(kitId);
        },
        error: (err) => {
          const errorMessage = err?.error?.errorResponse?.error || 'Failed to update test kit.';
          this.snackbarService.showError(errorMessage);
        },
      });
  }

  private showExpiredReagentWarning(onConfirm: () => void): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '480px',
      disableClose: true,
      data: {
        title: 'Warning: Expired Reagent',
        message: 'Warning: Selected reagent is expired. Do you want to continue?',
        confirmText: 'YES',
        cancelText: 'NO',
      } as ConfirmActionDialogData,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result === true) {
          onConfirm();
        }
      });
  }

  onCancel(): void {
    if (this.isCreateMode()) {
      this.isCreateMode.set(false);
      this.detailDirty.set(false);
      const items = this.testKitItems();
      if (items.length > 0) {
        this.selectKit(items[0].kitId);
      }
    } else if (this.selectedKitId()) {
      this.detailDirty.set(false);
      this.loadReagentsForKit(this.selectedKitId()!);
    }
  }

  onClearAll(): void {
    this.formDirective?.resetForm();
    this.testKitList.set([]);
    this.error.set(null);
    this.hasSearched.set(false);
    this.formDirty.set(false);
    this.selectedExpiredValue.set(null);
    this.selectedTestIdValue.set(null);
    this.expiredSearchControl.setValue('');
    this.testIdSearchControl.setValue('');
    this.isExpiredTruncated = false;
    this.isTestIdTruncated = false;
    this.selectedKitId.set(null);
    this.kitSearchText.set('');
    this.isCreateMode.set(false);
    this.reagentRows.set([]);
    this.reagentLovMap.set(new Map());
    this.detailDirty.set(false);
    this.isAgMagTest.set(false);
    this.searchBarComponent?.clearSearch();
  }

  onDetailClearAll(): void {
    if (this.isCreateMode()) {
      this.newKitQcExpiration.reset();
      this.newKitLicenseFlag.reset();
      this.reagentRows.set([{ reagentType: '', name: '', supplier: '', lotNo: '', expirationDate: '', isNew: true }]);
      this.reagentLovMap.set(new Map());
    } else {
      this.selectedKitId.set(null);
      this.reagentRows.set([]);
    }
    this.clearReagentNameSearch();
    this.detailDirty.set(false);
  }

  // Unsaved changes check for guard
  canDeactivate(): boolean {
    return !this.detailDirty() && !this.formDirty();
  }

  hasUnsavedChangesCheck(): boolean {
    return this.detailDirty() || this.formDirty();
  }

  protected onQcDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.newKitQcExpiration
    );
  }

  protected onQcDateBlur(): void {
    this.newKitQcExpiration.markAsTouched();
  }

  protected formatDateTime(value: string): string {
    if (!value) return '-';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : value;
  }
}
