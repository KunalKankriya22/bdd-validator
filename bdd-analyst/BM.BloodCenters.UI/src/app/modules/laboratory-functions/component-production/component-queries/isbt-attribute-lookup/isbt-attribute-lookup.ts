import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, finalize } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableColumn } from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';

import { IsbtAttributeLookupApiService } from './services/isbt-attribute-lookup-api.service';
import {
  IsbtAttributeDto,
  IsbtAttributeGroupDto,
  ProductFormulaDto,
  ProductLovOption,
  AttributeGroupLovOption,
  AttributeCodeLovOption,
} from './models/isbt-attribute-lookup.model';

@Component({
  selector: 'app-isbt-attribute-lookup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
  ],
  templateUrl: './isbt-attribute-lookup.html',
  styleUrl: './isbt-attribute-lookup.scss',
})
export class IsbtAttributeLookupComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(IsbtAttributeLookupApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly destroy$ = new Subject<void>();

  // Page header configuration
  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
  };

  // Search form
  searchForm: FormGroup;

  // Product formula form
  productForm: FormGroup;

  // Signals for state management
  readonly isSearchLoading = signal(false);
  readonly isProductLoading = signal(false);
  readonly hasSearched = signal(false);

  // Attribute Group display (read-only at top)
  readonly attributeGroup = signal<IsbtAttributeGroupDto | null>(null);

  // Search results
  readonly searchResults = signal<IsbtAttributeDto[]>([]);

  // Product formula data
  readonly productFormula = signal<ProductFormulaDto | null>(null);
  readonly productOptions = signal<ProductLovOption[]>([]);

  // LOV (List of Values) dropdown options
  readonly attributeGroupOptions = signal<AttributeGroupLovOption[]>([]);
  readonly newCodeOptions = signal<AttributeCodeLovOption[]>([]);
  readonly oldCodeOptions = signal<AttributeCodeLovOption[]>([]);

  // Search controls for dropdowns
  attribGroupSearchControl = new FormControl('');
  oldGroupSearchControl = new FormControl('');
  attribCodeSearchControl = new FormControl('');
  oldAttribCodeSearchControl = new FormControl('');
  productCodeSearchControl = new FormControl('');

  // Filtered options for searchable dropdowns (as signals for reactivity)
  readonly filteredAttribGroupOptions = signal<AttributeGroupLovOption[]>([]);
  readonly filteredOldGroupOptions = signal<AttributeGroupLovOption[]>([]);
  readonly filteredNewCodeOptions = signal<AttributeCodeLovOption[]>([]);
  readonly filteredOldCodeOptions = signal<AttributeCodeLovOption[]>([]);
  readonly filteredProductOptions = signal<ProductLovOption[]>([]);

  // Computed values
  readonly hasResults = computed(() => this.searchResults().length > 0);
  readonly showEmptyState = computed(() => this.hasSearched() && !this.hasResults() && !this.isSearchLoading());

  // Signal to track if any search field has a value
  readonly hasAnySearchValue = signal(false);

  // Button state computed values (same as Licensed Products)
  readonly isRetrieveDisabled = computed(() => {
    // RETRIEVE disabled if no field has a value OR if loading
    return this.isSearchLoading() || !this.hasAnySearchValue();
  });

  readonly canShowClearAll = computed(() => {
    // Show CLEAR ALL only after a successful search (hasSearched = true)
    return this.hasSearched();
  });

  // Table configuration
  resultsTableConfig: DataTableConfig<IsbtAttributeDto> = {
    columns: [
      {
        key: 'attribCode',
        header: 'Code',
        sortable: false,
        width: '180px',
        minWidth: '150px',
      },
      {
        key: 'oldAttribCode',
        header: 'Old Code',
        sortable: false,
        width: '180px',
        minWidth: '150px',
      },
      {
        key: 'attribDesc',
        header: 'Description',
        sortable: false,
        minWidth: '200px',
        truncate: true,
      },
    ],
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'No ISBT Attributes Found for the selected criteria',
    noDataIcon: 'edit',
  };

  constructor() {
    // Initialize search form (validators per FMB)
    this.searchForm = this.fb.group({
      attribGroup: [''],      // No validation needed for dropdown
      oldGroup: [''],         // No validation needed for dropdown
      attribCode: [''],       // No validation needed for dropdown (FMB: maxLength 10)
      oldAttribCode: [''],    // No validation needed for dropdown (FMB: maxLength 5)
      attribDesc: ['', [Validators.maxLength(10)]],  // Text input only
    });

    // Initialize product form
    this.productForm = this.fb.group({
      productCode: ['', [Validators.maxLength(5)]],
    });

    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadAllLovOptions();
    this.setupProductCodeWatcher();
    this.setupSearchFormWatchers();
    this.setupDropdownSearchFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all LOV (List of Values) options from API
   */
  private loadAllLovOptions(): void {
    this.loadAttributeGroupOptions();
    this.loadNewCodeOptions();
    this.loadOldCodeOptions();
    this.loadProductOptions();
  }

  /**
   * Load attribute group options for dropdown (both New and Old use same list)
   */
  private loadAttributeGroupOptions(): void {
    this.apiService
      .getAttributeGroupsLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groups) => {
          this.attributeGroupOptions.set(groups);
          this.filteredAttribGroupOptions.set(groups);
          this.filteredOldGroupOptions.set(groups);
        },
        error: (error) => {
          console.error('Error loading attribute groups:', error);
          this.snackbarService.showError('Failed to load attribute groups');
        },
      });
  }

  /**
   * Load new ISBT codes (V%) for dropdown
   */
  private loadNewCodeOptions(): void {
    this.apiService
      .getNewCodesLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.newCodeOptions.set(codes);
          this.filteredNewCodeOptions.set(codes);
        },
        error: (error) => {
          console.error('Error loading new codes:', error);
          this.snackbarService.showError('Failed to load new ISBT codes');
        },
      });
  }

  /**
   * Load old codes (non-V%) for dropdown
   */
  private loadOldCodeOptions(): void {
    this.apiService
      .getOldCodesLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.oldCodeOptions.set(codes);
          this.filteredOldCodeOptions.set(codes);
        },
        error: (error) => {
          console.error('Error loading old codes:', error);
          this.snackbarService.showError('Failed to load old codes');
        },
      });
  }

  /**
   * Load product options for dropdown
   */
  private loadProductOptions(): void {
    this.apiService
      .getProductsLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.productOptions.set(products);
          this.filteredProductOptions.set(products);
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.snackbarService.showError('Failed to load product codes');
        },
      });
  }

  /**
   * Setup search filtering for all dropdowns
   */
  private setupDropdownSearchFilters(): void {
    // Attribute Group (New) search
    this.attribGroupSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.filterAttribGroupOptions());

    // Old Group search
    this.oldGroupSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.filterOldGroupOptions());

    // New Code search
    this.attribCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.filterNewCodeOptions());

    // Old Code search
    this.oldAttribCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.filterOldCodeOptions());

    // Product Code search
    this.productCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.filterProductOptions());
  }

  /**
   * Filter attribute group options based on search text
   */
  private filterAttribGroupOptions(): void {
    const searchTerm = (this.attribGroupSearchControl.value || '').toLowerCase().trim();
    const groups = this.attributeGroupOptions();
    if (!searchTerm) {
      this.filteredAttribGroupOptions.set(groups);
    } else {
      this.filteredAttribGroupOptions.set(groups.filter(g =>
        (g.code && g.code.toLowerCase().includes(searchTerm)) ||
        (g.description && g.description.toLowerCase().includes(searchTerm))
      ));
    }
  }

  /**
   * Filter old group options based on search text
   */
  private filterOldGroupOptions(): void {
    const searchTerm = (this.oldGroupSearchControl.value || '').toLowerCase().trim();
    const groups = this.attributeGroupOptions();
    if (!searchTerm) {
      this.filteredOldGroupOptions.set(groups);
    } else {
      this.filteredOldGroupOptions.set(groups.filter(g =>
        (g.code && g.code.toLowerCase().includes(searchTerm)) ||
        (g.description && g.description.toLowerCase().includes(searchTerm))
      ));
    }
  }

  /**
   * Filter new code options based on search text
   */
  private filterNewCodeOptions(): void {
    const searchTerm = (this.attribCodeSearchControl.value || '').toLowerCase().trim();
    const codes = this.newCodeOptions();
    if (!searchTerm) {
      this.filteredNewCodeOptions.set(codes);
    } else {
      this.filteredNewCodeOptions.set(codes.filter(c =>
        (c.attribCode && c.attribCode.toLowerCase().includes(searchTerm)) ||
        (c.attribDesc && c.attribDesc.toLowerCase().includes(searchTerm))
      ));
    }
  }

  /**
   * Filter old code options based on search text
   */
  private filterOldCodeOptions(): void {
    const searchTerm = (this.oldAttribCodeSearchControl.value || '').toLowerCase().trim();
    const codes = this.oldCodeOptions();
    if (!searchTerm) {
      this.filteredOldCodeOptions.set(codes);
    } else {
      this.filteredOldCodeOptions.set(codes.filter(c =>
        (c.attribCode && c.attribCode.toLowerCase().includes(searchTerm)) ||
        (c.attribDesc && c.attribDesc.toLowerCase().includes(searchTerm))
      ));
    }
  }

  /**
   * Filter product options based on search text
   */
  private filterProductOptions(): void {
    const searchTerm = (this.productCodeSearchControl.value || '').toLowerCase().trim();
    const products = this.productOptions();
    if (!searchTerm) {
      this.filteredProductOptions.set(products);
    } else {
      this.filteredProductOptions.set(products.filter(p =>
        p.productCode.toLowerCase().includes(searchTerm) ||
        (p.description && p.description.toLowerCase().includes(searchTerm))
      ));
    }
  }

  /**
   * Watch for product code changes and fetch formula
   */
  private setupProductCodeWatcher(): void {
    this.productForm.get('productCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((productCode) => {
        if (productCode) {
          this.loadProductFormula(productCode);
        } else {
          this.productFormula.set(null);
        }
      });
  }

  /**
   * Setup watchers for search form fields to handle auto-lookup
   */
  private setupSearchFormWatchers(): void {
    // Track which field the user is actively changing to prevent circular updates
    let isUpdatingFromCode = false;

    // Watch attribGroup changes (auto-lookup when dropdown selection changes)
    this.searchForm.get('attribGroup')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (isUpdatingFromCode) {
          return; // Skip if we're updating from oldGroup lookup
        }

        if (value) {
          isUpdatingFromCode = true;
          this.lookupAttributeGroup(value, false, () => {
            isUpdatingFromCode = false;
          });
        } else {
          this.attributeGroup.set(null);
        }
      });

    // Watch oldGroup changes (auto-lookup when dropdown selection changes)
    // FMB: Only resolve new group if attrib_group is currently empty
    this.searchForm.get('oldGroup')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (isUpdatingFromCode) {
          return; // Skip if we're updating from attribGroup lookup
        }

        if (value) {
          const currentNewGroup = this.searchForm.get('attribGroup')?.value;
          if (!currentNewGroup) {
            isUpdatingFromCode = true;
            this.lookupAttributeGroup(value, true, () => {
              isUpdatingFromCode = false;
            });
          }
        }
      });

    // Watch attribCode changes to auto-populate description AND old code
    this.searchForm.get('attribCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value) {
          // Clear OLD code first (before lookup)
          this.searchForm.patchValue({ oldAttribCode: null }, { emitEvent: false });

          // Auto-populate description from dropdown
          const selectedCode = this.newCodeOptions().find(c => c.attribCode === value);
          if (selectedCode && selectedCode.attribDesc) {
            this.searchForm.patchValue({ attribDesc: selectedCode.attribDesc }, { emitEvent: false });
          }

          // Auto-populate OLD code by calling API (Oracle Forms: lookup old_attrib_code)
          this.lookupOldCodeFromNewCode(value);
        } else {
          // Clear OLD code when NEW code is cleared
          this.searchForm.patchValue({ oldAttribCode: null }, { emitEvent: false });
        }
      });

    // Watch oldAttribCode changes to auto-populate NEW code and description
    this.searchForm.get('oldAttribCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value) {
          this.searchForm.patchValue({ attribCode: null, attribDesc: null }, { emitEvent: false });
          this.lookupNewCodeFromOldCode(value);
        } else if (!value) {
          // Clear NEW code when OLD code is cleared
          this.searchForm.patchValue({ attribCode: null, attribDesc: null }, { emitEvent: false });
        }
      });

    // Watch all search fields to enable/disable RETRIEVE button
    this.searchForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((formValue) => {
        const hasValue = !!(formValue.attribGroup || formValue.oldGroup || formValue.attribCode || formValue.oldAttribCode);
        this.hasAnySearchValue.set(hasValue);
      });
  }

  /**
   * Lookup attribute group details
   * Auto-populates description and OLD/NEW group mapping
   */
  private lookupAttributeGroup(code: string, isOldGroup?: boolean, onComplete?: () => void): void {
    const isOld = isOldGroup ?? false;
    this.apiService
      .getAttributeGroup(code)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (group) => {
          this.attributeGroup.set(group);

          // Auto-populate the corresponding field based on which dropdown was used
          if (isOld && group.code) {
            // User selected OLD group -> auto-fill NEW group
            this.searchForm.patchValue({ attribGroup: group.code }, { emitEvent: false });
          } else if (!isOld) {
            // User selected NEW group -> auto-fill OLD group (even if null to clear previous value)
            this.searchForm.patchValue({ oldGroup: group.oldGroup || null }, { emitEvent: false });
          }

          // Call completion callback to reset the lock
          if (onComplete) {
            onComplete();
          }
        },
        error: (error) => {
          const errorMsg = HttpErrorHandler.extractErrorMessage(error, 'Attribute group not found');
          this.snackbarService.showError(errorMsg);
          this.attributeGroup.set(null);

          // Call completion callback even on error to reset the lock
          if (onComplete) {
            onComplete();
          }
        },
      });
  }

  /**
   * Lookup OLD attribute code from NEW attribute code
   * Oracle Forms: ATTRIB_CODE.KEY-NEXT-ITEM trigger
   *
   * Note: OLD_ATTRIB_CODE values (e.g., @03, @04) are stored in the database
   * but may NOT exist as actual ATTRIB_CODE entries in the dropdown LOV.
   * We dynamically add them to the dropdown options when found.
   */
  private lookupOldCodeFromNewCode(newCode: string): void {
    this.apiService
      .getOldCodeFromNewCode(newCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result?.oldAttribCode) {
            const oldCode = result.oldAttribCode;
            const oldCodeOptions = this.oldCodeOptions();
            const exists = oldCodeOptions.some(opt => opt.attribCode === oldCode);

            if (!exists) {
              const newOption: AttributeCodeLovOption = {
                attribCode: oldCode,
                attribDesc: result.attribDesc || ''
              };
              const updatedOptions = [...oldCodeOptions, newOption];
              this.oldCodeOptions.set(updatedOptions);
              this.filteredOldCodeOptions.set(updatedOptions);

              setTimeout(() => {
                this.searchForm.patchValue(
                  { oldAttribCode: oldCode },
                  { emitEvent: false }
                );
              }, 0);
            } else {
              this.searchForm.patchValue(
                { oldAttribCode: oldCode },
                { emitEvent: false }
              );
            }
          }
        },
        error: () => {
          // Silent failure - OLD code mapping is optional
        },
      });
  }

  /**
   * Lookup NEW attribute code (and description) from OLD attribute code
   * Oracle Forms: OLD_ATTRIB_CODE.KEY-NEXT-ITEM trigger
   *
   * Note: Some codes (like RRC, +08) are in the OLD dropdown but NOT in the NEW dropdown
   * (NEW dropdown only shows V% codes). We need to add them dynamically.
   */
  private lookupNewCodeFromOldCode(oldCode: string): void {
    this.apiService
      .getNewCodeFromOldCode(oldCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result?.attribCode) {
            const newCode = result.attribCode;
            const newCodeOptions = this.newCodeOptions();
            const exists = newCodeOptions.some(opt => opt.attribCode === newCode);

            if (!exists) {
              const newOption: AttributeCodeLovOption = {
                attribCode: newCode,
                attribDesc: result.attribDesc || ''
              };
              const updatedOptions = [...newCodeOptions, newOption];
              this.newCodeOptions.set(updatedOptions);
              this.filteredNewCodeOptions.set(updatedOptions);

              setTimeout(() => {
                this.searchForm.patchValue(
                  {
                    attribCode: newCode,
                    attribDesc: result.attribDesc || null,
                  },
                  { emitEvent: false }
                );
              }, 0);
            } else {
              this.searchForm.patchValue(
                {
                  attribCode: newCode,
                  attribDesc: result.attribDesc || null,
                },
                { emitEvent: false }
              );
            }
          }
        },
        error: (error) => {
          const errorMsg = HttpErrorHandler.extractErrorMessage(error, 'Attribute code not found');
          this.snackbarService.showError(errorMsg);
        },
      });
  }

  /**
   * Load product formula by product code
   */
  private loadProductFormula(productCode: string): void {
    this.isProductLoading.set(true);
    this.apiService
      .getProductFormula(productCode)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isProductLoading.set(false))
      )
      .subscribe({
        next: (formula) => {
          this.productFormula.set(formula);
        },
        error: (error) => {
          const errorMsg = HttpErrorHandler.extractErrorMessage(error, 'Product not found');
          this.snackbarService.showError(errorMsg);
          this.productFormula.set(null);
        },
      });
  }

  /**
   * Execute search
   *
   * FMB Behavior:
   * - ALWAYS passes attribGroup to query (even if NULL/empty)
   * - When attribGroup is NULL → Query returns ZERO records
   * - attribCode/oldAttribCode are only used for validation/display, NOT for filtering
   */
  onRetrieve(): void {
    const formValue = this.searchForm.value;
    const currentGroup = this.attributeGroup();

    this.isSearchLoading.set(true);
    this.hasSearched.set(true);

    // Build search params per FMB behavior
    // CRITICAL: Always pass attribGroup (even if null/empty) to match FMB query behavior
    // The FMB query is: WHERE ATTRIB_GROUP = :ctrl_block_1.attrib_group ORDER BY ATTRIB_CODE
    // If attrib_group is NULL → returns ZERO records (WHERE ATTRIB_GROUP = NULL is always false)
    // FMB does NOT filter by unit_scheme_type in the main query (only in LOV dropdowns)
    const searchParams = {
      attribGroup: currentGroup?.code || '',  // ✅ Always pass (empty string if null)
      oldGroup: currentGroup?.oldGroup || '',  // ✅ Always pass (empty string if null)
      attribCode: formValue.attribCode || '',  // Pass for context but doesn't affect query
      oldAttribCode: formValue.oldAttribCode || '',  // Pass for context but doesn't affect query
    };

    this.apiService
      .searchAttributes(searchParams)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSearchLoading.set(false))
      )
      .subscribe({
        next: (results) => {
          this.searchResults.set(results);

          if (results.length === 0) {
            this.snackbarService.showInfo('No records found');
          }
          // Don't show success notification when records are found
        },
        error: (error) => {
          const errorMsg = HttpErrorHandler.extractErrorMessage(error, 'Failed to search attributes');
          this.snackbarService.showError(errorMsg);
          this.searchResults.set([]);
        },
      });
  }

  /**
   * Clear all search fields and results
   */
  onClearAll(): void {
    this.searchForm.reset();
    this.productForm.reset();  // Clear product formula as well
    this.searchResults.set([]);
    this.hasSearched.set(false);
    this.hasAnySearchValue.set(false);  // Reset button state
    this.attributeGroup.set(null);
    this.productFormula.set(null);  // Clear product formula data

    setTimeout(() => {
      const firstSelect = document.querySelector<HTMLElement>('mat-select[formControlName="attribGroup"]');
      firstSelect?.focus();
    }, 100);
  }

  /**
   * Transform input to uppercase
   */
  toUpperCase(controlName: string): void {
    const control = this.searchForm.get(controlName) || this.productForm.get(controlName);
    if (control) {
      const value = control.value;
      if (value) {
        control.setValue(value.toUpperCase(), { emitEvent: false });
      }
    }
  }
}
