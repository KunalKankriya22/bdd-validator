import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, startWith } from 'rxjs/operators';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { MenuService } from '@shared/services/menu.service';
import { LoginService } from '@shared/services/login.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

// Using real backend service
import { InternalContractService } from './internal-contract.service';
import { ContractWithDetails, ContractTest, Contact, SaveContractRequest } from './internal-contract.models';
import { TestDialogComponent, TestDialogData } from './components/test-dialog/test-dialog.component';
import { ContactDialogComponent, ContactDialogData } from './components/contact-dialog/contact-dialog.component';
import { InternalContractFilterPanelComponent, InternalContractFilterValue } from './internal-contract-filter-panel/internal-contract-filter-panel.component';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { InternalContractFilterChipsUtils } from './utils/filter-chips.utils';
import { InternationalAddressDialogComponent } from '@shared/components/international-address-dialog/international-address-dialog.component';
import { InternationalAddressDialogData, InternationalAddressModel } from '@shared/models/international-address.model';
import { HeaderService } from '@shared/services/header.service';
import { getErrorMessage } from './constants/internal-contract-error-codes';

@Component({
  selector: 'app-internal-contract',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    LoadingSpinnerComponent,
    InternalContractFilterPanelComponent,
    FilterChips,
    NgxMatSelectSearchModule
  ],
  templateUrl: './internal-contract.component.html',
  styleUrl: './internal-contract.component.scss'
})
export class InternalContractComponent implements OnInit, OnDestroy {
  @ViewChild('testsPanel', { read: ElementRef }) testsPanel!: ElementRef;
  @ViewChild('filterButton', { read: ElementRef }) filterButton!: ElementRef;

  // Dependency injection
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly contractService = inject(InternalContractService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly menuService = inject(MenuService);
  private readonly loginService = inject(LoginService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();
  private readonly overlayClose$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Internal Contract', link: null }
    ],
    title: 'Internal Contract',
    subtitle: 'Define and manage internal contract information and related details.'
  };

  // Search bar configuration for tests
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Test ID or Description',
    minLength: 2,
    searchOnEnterOnly: true
  };

  // Tests table configuration
  testsTableConfig: DataTableConfig<ContractTest> = {
    columns: [
      { key: 'testId', header: 'Test ID', sortable: false, width: '100px' },
      { key: 'testDescription', header: 'Description', sortable: false, width: '250px' },
      { key: 'stopLabelFlag', header: 'Label', sortable: false, width: '80px',
        valueFormatter: (value: string) => value === 'Y' ? 'Yes' : value === 'N' ? 'No' : value },
      { key: 'effDate', header: 'Effective Date', sortable: false, width: '140px',
        valueFormatter: (value: string) => this.formatDate(value) },
      { key: 'termDate', header: 'Termination Date', sortable: false, width: '140px',
        valueFormatter: (value: string | null) => this.formatDate(value) },
      { key: 'lastModifiedDate', header: 'Modified Date', sortable: false, width: '140px',
        valueFormatter: (value: string) => this.formatDate(value) }
    ],
    rowActions: [{ icon: 'edit', label: 'Edit test', action: 'edit' }],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50],
      showFirstLastButtons: false
    },
    stickyHeader: true,
    emptyMessage: 'No Tests Available To Display',
    showPagination: false
  };

  // State signals
  readonly loading = signal<boolean>(false);
  readonly loadingContracts = signal<boolean>(false);
  readonly hasError = signal<boolean>(false);
  readonly isDetailPanelOpen = signal<boolean>(false);
  readonly isFilterPanelOpen = signal<boolean>(false);
  readonly contractData = signal<ContractWithDetails | null>(null);
  readonly testsDataSource = signal<ContractTest[]>([]);
  readonly filteredTests = signal<ContractTest[]>([]);
  readonly contractsList = signal<Array<{contractId: string; company: string}>>([]);
  readonly currentFilters = signal<InternalContractFilterValue | null>(null);
  readonly filterChips = signal<FilterChip[]>([]);

  // Contract selection
  readonly selectedContractId = signal<string | null>(null);
  readonly filteredContracts = signal<Array<{contractId: string; company: string}>>([]);
  readonly contractSearchControl = new FormControl('');

  // Lookup data for displaying descriptions
  readonly contractTypes = signal<Array<{codeValue: string; codeDescription: string}>>([]);
  readonly barcodeProtocols = signal<Array<{codeValue: string; codeDescription: string}>>([]);
  readonly validTests = signal<Array<{testId: string; testDescription: string}>>([]);

  ngOnInit(): void {
    this.loadContractsList();
    this.loadLookups();
    this.setupContractSearch();
  }

  private setupContractSearch(): void {
    this.contractSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        const allContracts = this.contractsList();
        this.filteredContracts.set(
          allContracts.filter(contract =>
            contract.contractId.toLowerCase().includes(term) ||
            contract.company.toLowerCase().includes(term)
          )
        );
      });
  }

  ngOnDestroy(): void {
    this.closeFilterOverlay();
    this.destroy$.next();
    this.destroy$.complete();
    this.overlayClose$.next();
    this.overlayClose$.complete();
  }

  loadContractsList(): void {
    this.loadingContracts.set(true);

    // Fetch contracts LOV (simple list with contractId and company)
    // Automatically filtered by user's chapter via X-ChapterId header
    // Matches FMB LOV behavior
    this.contractService.getContractsLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contracts) => {
          this.contractsList.set(contracts);
          this.filteredContracts.set(contracts);
          this.loadingContracts.set(false);
        },
        error: (error) => {
          console.error('Error loading contracts list:', error);
          this.loadingContracts.set(false);
          this.snackbarService.showError('Failed to load contracts list.');
        }
      });
  }

  loadLookups(): void {
    // Load contract types
    this.contractService.getContractTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => this.contractTypes.set(types),
        error: (err) => console.error('Failed to load contract types:', err)
      });

    // Load barcode protocols
    this.contractService.getBarcodeProtocols()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (protocols) => this.barcodeProtocols.set(protocols),
        error: (err) => console.error('Failed to load barcode protocols:', err)
      });

    // Load valid tests
    this.contractService.getValidTests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tests) => this.validTests.set(tests),
        error: (err) => console.error('Failed to load valid tests:', err)
      });
  }


  onRetrieve(): void {
    const selectedId = this.selectedContractId();

    if (!selectedId) {
      return;
    }

    this.loading.set(true);
    this.hasError.set(false);

    this.contractService.getById(selectedId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: ContractWithDetails) => {
          this.contractData.set(data);
          this.testsDataSource.set(data.tests || []);
          this.filteredTests.set(data.tests || []);
          this.isDetailPanelOpen.set(true);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading contract:', error);
          this.hasError.set(true);
          this.loading.set(false);
          this.snackbarService.showError('Failed to load contract. Please try again.');
        }
      });
  }

  onClearAll(): void {
    this.selectedContractId.set(null);
    this.closeDetailPanel();
    this.contractData.set(null);
    this.testsDataSource.set([]);
    this.filteredTests.set([]);
    this.hasError.set(false);
  }

  closeDetailPanel(): void {
    this.isDetailPanelOpen.set(false);
  }

  onSearch(searchKeyword: string): void {
    const keyword = searchKeyword.toLowerCase();
    const allTests = this.testsDataSource();

    if (!keyword) {
      this.filteredTests.set(allTests);
      return;
    }

    const filtered = allTests.filter(test =>
      test.testId.toLowerCase().includes(keyword) ||
      (test.testDescription && test.testDescription.toLowerCase().includes(keyword))
    );

    this.filteredTests.set(filtered);
  }

  onAddTest(): void {
    const contractData = this.contractData();
    if (!contractData) return;

    const existingTestIds = this.testsDataSource().map(t => t.testId);

    const dialogData: TestDialogData = {
      mode: 'create',
      validTests: this.validTests(),
      existingTestIds
    };

    const dialogRef = this.dialog.open(TestDialogComponent, {
      width: '600px',
      maxWidth: '600px',
      height: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'test-dialog-drawer-panel',
      autoFocus: 'first-heading',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        const test = result.test || result;
        if (test) {
          // Call API to save the test
          const contractId = contractData.contract.contractId;
          const chapterId = contractData.contract.chapterId;
          this.contractService.createContractTest(contractId, chapterId, test)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (savedTest) => {
                // Reload all tests from API to ensure fresh data
                this.reloadTests(contractId, chapterId);
                this.snackbarService.showSuccess('Test added successfully');

                if (result.addAnother) {
                  setTimeout(() => this.onAddTest(), 100);
                }
              },
              error: (error) => {
                console.error('Error adding test:', error);
                this.snackbarService.showError('Failed to add test. Please try again.');
              }
            });
        }
      }
    });
  }

  onEditTest(test: ContractTest): void {
    const existingTestIds = this.testsDataSource()
      .filter(t => t.testId !== test.testId)
      .map(t => t.testId);

    const dialogData: TestDialogData = {
      test: { ...test },
      mode: 'edit',
      validTests: this.validTests(),
      existingTestIds
    };

    const dialogRef = this.dialog.open(TestDialogComponent, {
      width: '600px',
      maxWidth: '600px',
      height: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'test-dialog-drawer-panel',
      autoFocus: 'first-heading',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: ContractTest | undefined) => {
      if (result) {
        // Call API to update the test
        const contractData = this.contractData();
        if (!contractData) return;

        const contractId = contractData.contract.contractId;
        const chapterId = contractData.contract.chapterId;
        this.contractService.updateContractTest(contractId, test.testId, chapterId, result)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updatedTest) => {
              // Reload all tests from API to ensure fresh data
              this.reloadTests(contractId, chapterId);
              this.snackbarService.showSuccess('Test updated successfully');
            },
            error: (error) => {
              console.error('Error updating test:', error);
              this.snackbarService.showError('Failed to update test. Please try again.');
            }
          });
      }
    });
  }

  onRowAction(event: {action: string; row: ContractTest}): void {
    if (event.action === 'edit') {
      this.onEditTest(event.row);
    }
  }

  onEdit(): void {
    const contractData = this.contractData();
    if (!contractData) {
      return;
    }

    // Get the first contact from the contract data, or create empty contact if none exists
    const existingContact = contractData.contacts && contractData.contacts.length > 0
      ? contractData.contacts[0]
      : null;

    // Open contact dialog for editing contract contact information
    const dialogData: ContactDialogData = {
      mode: 'edit',
      contact: existingContact || {
        contactId: null,
        contractId: contractData.contract.contractId,
        chapterId: contractData.contract.chapterId,
        contactType: 'C',
        contactLastName: '',
        contactFirstName: '',
        contactTitle: null,
        phoneNumber: null,
        faxNumber: null
      },
      contractData: this.contractData() || undefined,
      contractTypes: this.contractTypes(),
      barcodeProtocols: this.barcodeProtocols()
    };

    const dialogRef = this.dialog.open(ContactDialogComponent, {
      width: '600px',
      maxWidth: '600px',
      height: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'contact-dialog-drawer-panel',
      autoFocus: 'first-heading',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        // Build SaveContractRequest with updated contract and contact data
        const saveRequest: SaveContractRequest = {
          contract: result.contract,
          address: contractData.address,
          contacts: result.contact ? [result.contact] : contractData.contacts,
          tests: contractData.tests,
          loggedInUserName: this.loginService.getStoredUsername() || '',
          chapterId: this.headerService.getCurrentChapterId(),
          programId: 'INTCONT'
        };

        // Call update API
        this.contractService.update(result.contract.contractId, saveRequest)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.snackbarService.showSuccess('Contract updated successfully');
              // Reload the contract details
              this.onRetrieve();
            },
            error: (error) => {
              const errorCode = error.error?.errorCode || error.error?.errorResponse?.errorCode;
              const errorMessage = errorCode
                ? getErrorMessage(errorCode)
                : (error.error?.message || error.error?.error || 'Failed to update contract. Please try again.');
              this.snackbarService.showError(errorMessage);
            }
          });
      }
    });
  }

  /**
   * Reload tests from API after add/edit/delete operations
   */
  private reloadTests(contractId: string, chapterId: string): void {
    this.contractService.getContractTests(contractId, chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tests) => {
          this.testsDataSource.set(tests);
          this.filteredTests.set(tests);
        },
        error: (error) => {
          console.error('Error reloading tests:', error);
        }
      });
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  formatDateTime(dateTime: string | null | undefined): string {
    if (!dateTime) return '-';
    const m = moment(dateTime);
    return m.isValid() ? m.format('DD-MMM-YYYY, HH:mm').toUpperCase() : '-';
  }

  getContractTypeDescription(code: string | null): string {
    if (!code) return '-';
    const type = this.contractTypes().find(t => t.codeValue === code);
    return type ? type.codeDescription : code;
  }

  getBarcodeProtocolDescription(code: string | null): string {
    if (!code) return '-';
    const protocol = this.barcodeProtocols().find(p => p.codeValue === code);
    return protocol ? protocol.codeDescription : code;
  }

  /**
   * Get the first contact from the contacts array
   * Returns the first contact or null if no contacts exist
   */
  getFirstContact(): Contact | null {
    const data = this.contractData();
    if (!data || !data.contacts || data.contacts.length === 0) {
      return null;
    }
    return data.contacts[0];
  }

  onOpenFilter(): void {
    if (this.overlayRef) {
      this.closeFilterOverlay();
      return;
    }

    this.isFilterPanelOpen.set(true);

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.testsPanel)
      .withPositions([
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 16,
          offsetY: 60
        }
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const portal = new ComponentPortal(InternalContractFilterPanelComponent);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.currentFilters();

    componentRef.instance.apply
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(filters => {
        this.onApplyFilter(filters);
        this.closeFilterOverlay();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => {
        this.closeFilterOverlay();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => {
        this.closeFilterOverlay();
      });

    this.overlayRef.keydownEvents()
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(event => {
        if (event.key === 'Escape') {
          this.closeFilterOverlay();
        }
      });
  }

  private closeFilterOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterPanelOpen.set(false);
      this.overlayClose$.next();
      this.filterButton?.nativeElement?.focus();
    }
  }

  onApplyFilter(filters: InternalContractFilterValue): void {
    this.currentFilters.set(filters);

    // Convert filters to chips for display
    const chips = InternalContractFilterChipsUtils.convertFiltersToChips(filters);
    this.filterChips.set(chips);

    // Apply filters to the tests data
    this.applyFilters();
  }

  onRemoveFilterChip(chipKey: string): void {
    const updatedFilters = InternalContractFilterChipsUtils.removeFilterByChipKey(
      this.currentFilters(),
      chipKey
    );
    this.currentFilters.set(updatedFilters);

    // Update chips
    const chips = InternalContractFilterChipsUtils.convertFiltersToChips(updatedFilters);
    this.filterChips.set(chips);

    // Re-apply filters
    this.applyFilters();
  }

  onClearAllFilters(): void {
    this.currentFilters.set(null);
    this.filterChips.set([]);
    this.applyFilters();
  }

  private applyFilters(): void {
    const filters = this.currentFilters();
    let filtered = [...this.testsDataSource()];

    if (filters) {
      // Apply effective date filter
      if (filters.effectiveDate && filters.effectivePeriod) {
        const filterDate = moment(filters.effectiveDate).startOf('day');
        filtered = filtered.filter(test => {
          const testDate = moment(test.effDate).startOf('day');
          if (filters.effectivePeriod === 'After') {
            return testDate.isSameOrAfter(filterDate, 'day');
          } else {
            return testDate.isSameOrBefore(filterDate, 'day');
          }
        });
      }

      // Apply termination date filter
      if (filters.terminationDate && filters.terminationPeriod) {
        const filterDate = moment(filters.terminationDate).startOf('day');
        filtered = filtered.filter(test => {
          if (!test.termDate) return false;
          const testDate = moment(test.termDate).startOf('day');
          if (filters.terminationPeriod === 'After') {
            return testDate.isSameOrAfter(filterDate, 'day');
          } else {
            return testDate.isSameOrBefore(filterDate, 'day');
          }
        });
      }
    }

    this.filteredTests.set(filtered);
  }

  /**
   * Opens the International Address dialog
   * Uses non-DB mode - captures address data locally and includes it in contract update
   * Per FMB behavior: address is saved to ADDRESSES_LAB via contract update, not separate API
   */
  openInternationalAddress(): void {
    const contract = this.contractData();
    if (!contract) return;

    // Map existing ADDRESSES_LAB data to InternationalAddressModel format
    const existingAddress: InternationalAddressModel | null = contract.address ? {
      streetName: contract.address.addr1 || '',
      addr1: contract.address.addr1 || null,
      addr2: contract.address.addr2 || null,
      addr3: contract.address.addr3 || null,
      addr4: null, // ADDRESSES_LAB doesn't have addr4
      country: contract.address.country || '',
      postalCode: contract.address.zip || null,
      homePhoneNo: contract.address.phoneNumber || null,
      workPhoneNo: contract.address.intPhoneNumber || null,
      workPhoneExt: null,
      mobilePhoneNo: null,
      faxNo: contract.address.faxNumber || null,
      email: null,
      intlAddrFlag: contract.address.intFlag || 'N',
      modifiedFlag: 'N'
    } : null;

    const dialogData: InternationalAddressDialogData = {
      existingAddress: existingAddress,
      // NO targetTable - triggers non-DB mode (dialog returns data without saving)
    };

    this.dialog.open(InternationalAddressDialogComponent, {
      width: '600px',
      panelClass: 'right-side-drawer',
      position: { right: '0', top: '64px' },
      height: 'calc(100vh - 64px)',
      autoFocus: 'first-heading',
      data: dialogData
    }).afterClosed().subscribe((result: InternationalAddressModel | undefined) => {
      if (result) {
        // Save contract with international address data
        this.saveContractWithInternationalAddress(result);
      }
    });
  }

  /**
   * Saves contract with international address fields
   * Calls Internal Contract update API with address fields included
   * Backend expects flat UpdateContractRequestDto, not nested SaveContractRequest
   */
  private saveContractWithInternationalAddress(addressData: InternationalAddressModel): void {
    const contract = this.contractData();
    if (!contract) return;

    // Build flat update request matching backend UpdateContractRequestDto
    // IMPORTANT: Use null instead of undefined - undefined gets stripped from JSON
    // IMPORTANT: CITY column is NOT NULL in database AND Oracle treats '' as NULL
    //           So we preserve existing city or use a space ' ' for international addresses
    const updateRequest = {
      // Contract fields - include ALL fields from contract object
      company: contract.contract.company,
      addressId: contract.contract.addressId,
      taxIdForm: contract.contract.taxIdForm ?? null,
      barCodeProtocol: contract.contract.barCodeProtocol,
      unitIdPattern: contract.contract.unitIdPattern ?? null,
      ediInputInd: contract.contract.ediInputInd ?? null,
      resultOutputInd: contract.contract.resultOutputInd,
      confirmTestFlag: contract.contract.confirmTestFlag ?? null,
      effDate: contract.contract.effDate,
      termDate: contract.contract.termDate ?? null,
      contractType: contract.contract.contractType,

      // International address fields (ADDRESSES_LAB)
      addr1: addressData.addr1 || addressData.streetName, // streetName is required
      addr2: addressData.addr2 ?? null,
      addr3: addressData.addr3 ?? null,
      // Oracle treats empty string as NULL, so use space or preserve existing
      city: contract.address?.city || ' ', // Preserve existing or use space
      stateCode: null, // International address = no state code required
      zip: addressData.postalCode ?? null,
      country: addressData.country,
      phoneNumber: addressData.homePhoneNo ?? null,
      intPhoneNumber: addressData.workPhoneNo ?? null,
      telexNumber: null, // Not captured in InternationalAddressModel
      faxNumber: addressData.faxNo ?? null,
      intFlag: 'Y' // Always 'Y' for international address
    };

    // Call Internal Contract update API
    // Note: service.update() accepts SaveContractRequest but we're sending flat DTO directly
    this.contractService.update(contract.contract.contractId, updateRequest as any)
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess('International address saved successfully');
          this.onRetrieve(); // Refresh contract data
        },
        error: (err: any) => {
          const errorCode = err.error?.errorCode || err.error?.errorResponse?.errorCode;
          const errorMessage = errorCode
            ? getErrorMessage(errorCode)
            : (err.error?.message || err.error?.error || 'Failed to save international address');
          this.snackbarService.showError(errorMessage);
        }
      });
  }
}
