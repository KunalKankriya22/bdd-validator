import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  signal,
  computed,
  inject,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { UnitIdFieldComponent, UnitValidationResponse, UnitIdPostValidateEvent } from '@shared/components/unit-id-field';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableColumn } from '@shared/interfaces/data-table.interface';

import {
  ValidInterdiction,
  AddedInterdictionItem,
  CreateUnitInterdictionDto
} from './models/add-interdiction.model';
import { AddInterdictionService } from './services/add-interdiction.service';
import { ROUTE_REGISTRY } from '../../../core/constants/route-registry';
import { RouteKey } from '../../../core/constants/route-keys';
import { ROUTES } from '../../../core/constants/route.constants';
import { TableSortEvent } from '@shared/interfaces/data-table.interface';

@Component({
  selector: 'app-add-interdiction-for-units-not-checked',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    NgxMatSelectSearchModule,
    DataTable
  ],
  templateUrl: './add-interdiction-for-units-not-checked.html',
  styleUrls: ['./add-interdiction-for-units-not-checked.scss']
})
export class AddInterdictionForUnitsNotCheckedComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `add-interdiction-${AddInterdictionForUnitsNotCheckedComponent.nextId++}`;

  // ID generators for accessibility
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AddInterdictionService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly menuService = inject(MenuService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // Component state signals
  protected readonly validInterdictions = signal<ValidInterdiction[]>([]);
  protected readonly filteredInterdictions = signal<ValidInterdiction[]>([]);
  private readonly rawInterdictions = signal<AddedInterdictionItem[]>([]);
  protected readonly addedInterdictions = computed(() => this.getSortedData());
  protected readonly loading = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly selectedInterdiction = signal<ValidInterdiction | null>(null);
  protected readonly currentUnitId = signal<string>('');
  protected readonly sessionCount = signal<number>(0);
  protected readonly checkDigit = signal<string | null>(null);
  protected readonly currentSort = signal<{ column: string; direction: 'A' | 'D' | 'default' }>({
    column: 'unitId',
    direction: 'A'
  });
  protected readonly statusMessage = signal<string>('');

  // Search control for interdiction code dropdown
  protected readonly interdictionSearchControl = new FormControl<string>('');

  // Computed values
  protected readonly hasInterdictions = computed(() => this.rawInterdictions().length > 0);
  protected readonly isFormValid = computed(() => {
    return !!(
      this.unitIdField?.isValid &&
      this.interdictionForm.get('interCode')?.value
    );
  });
  protected readonly isClearAllDisabled = computed(() => {
    const hasUnitId = !!this.currentUnitId();
    const hasInterdictionCode = !!this.interdictionForm.get('interCode')?.value;
    const hasAddedInterdictions = this.rawInterdictions().length > 0;
    // Enable CLEAR ALL if ANY of the following exist: Unit ID, Interdiction Code, or added interdictions
    return !hasUnitId && !hasInterdictionCode && !hasAddedInterdictions;
  });

  /**
   * Get sorted data based on current sort configuration
   */
  private getSortedData(): AddedInterdictionItem[] {
    const data = [...this.rawInterdictions()];
    const sort = this.currentSort();

    if (sort.direction === 'default') {
      return data;
    }

    return data.sort((a, b) => {
      const aValue = String(a[sort.column as keyof AddedInterdictionItem] || '').toLowerCase();
      const bValue = String(b[sort.column as keyof AddedInterdictionItem] || '').toLowerCase();

      const comparison = aValue.localeCompare(bValue);
      return sort.direction === 'A' ? comparison : -comparison;
    });
  }

  /**
   * Handle sort change from data table
   */
  onSortChange(event: TableSortEvent): void {
    this.currentSort.set({
      column: event.column,
      direction: event.direction
    });

    // Update table config to reflect new sort state
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: {
        column: event.column,
        direction: event.direction
      }
    };
  }

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  // Form
  interdictionForm!: FormGroup;

  // Table configuration
  tableConfig!: DataTableConfig<AddedInterdictionItem>;

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.AddInterdictionForUnitsNotChecked].path;
        const menuItem = this.menuService.findMenuItemByPath(basePath);

        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: ROUTES.HOME },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || ''
          };
        }
      }
    });
  }

  ngOnInit(): void {
    this.initializeTableConfig();
    this.initializeForm();
    this.subscribeToChapterChanges();
    this.setupInterdictionSearch();
  }

  /**
   * Setup search functionality for interdiction code dropdown
   */
  private setupInterdictionSearch(): void {
    this.interdictionSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        const allInterdictions = this.validInterdictions();
        this.filteredInterdictions.set(
          allInterdictions.filter((inter) =>
            inter.interCode.toLowerCase().includes(term) ||
            inter.interDesc?.toLowerCase().includes(term)
          )
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize data table configuration
   */
  private initializeTableConfig(): void {
    const columns: TableColumn<AddedInterdictionItem>[] = [
      {
        key: 'unitId',
        header: 'Unit ID',
        sortable: true,
        type: 'text'
      },
      {
        key: 'interCode',
        header: 'Interdiction Code',
        sortable: false,
        type: 'text'
      },
      {
        key: 'interDesc',
        header: 'Description',
        sortable: false,
        type: 'text'
      },
      {
        key: 'interType',
        header: 'Type',
        sortable: false,
        type: 'text'
      }
    ];

    this.tableConfig = {
      columns,
      stickyHeader: true,
      showPagination: false,
      emptyMessage: 'No Results to Display',
      emptySubMessage: 'Scan or enter a Unit ID to begin.',
      noDataIcon: 'search',
      // Default sort: Unit ID ascending ('A' = ascending, 'D' = descending)
      sortConfig: {
        column: 'unitId',
        direction: 'A'
      }
    };
  }

  private initializeForm(): void {
    this.interdictionForm = this.fb.group({
      interCode: ['', Validators.required]
    });

    // Subscribe to interdiction code changes to update description/type display
    this.interdictionForm.get('interCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(interCode => {
        this.handleInterdictionCodeChange(interCode);
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reset entire component state when chapter changes
        this.clearAll();
      });
  }

  private handleInterdictionCodeChange(interCode: string): void {
    if (!interCode) {
      this.selectedInterdiction.set(null);
      return;
    }

    const selected = this.validInterdictions().find(i => i.interCode === interCode);
    this.selectedInterdiction.set(selected || null);
  }

  /**
   * Called when interdiction code is selected from dropdown
   * Automatically adds the interdiction (like Oracle Forms KEY-NEXT-ITEM)
   */
  onInterdictionSelected(): void {
    // Wait for the form value to update
    setTimeout(() => {
      this.onPlaceInterdiction();
    }, 0);
  }

  /**
   * Post-validation: Check if unit exists after format validation
   */
  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const unitId = event.data.parsedUnitId;

    // Check if unit already exists (has been checked in)
    this.service.checkUnitExists(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (checkResult) => {
          if (checkResult.exists) {
            // Unit already checked in - reject validation
            event.reject(
              checkResult.message || 'Unit already checked in - cannot add interdiction for units not checked.'
            );
          } else {
            // Unit doesn't exist - valid for this screen
            event.confirm();
          }
        },
        error: (err) => {
          event.reject(
            err?.error?.message || 'Failed to verify unit status.'
          );
        }
      });
  }

  /**
   * Called when Unit ID field is validated successfully
   * (after both format validation AND post-validation confirm)
   */
  onUnitIdValidated(data: UnitValidationResponse): void {
    const unitId = data.parsedUnitId;
    if (!unitId) return;

    this.currentUnitId.set(unitId);
    this.checkDigit.set(data.checkDigit);
    this.loadValidInterdictions(unitId);
  }

  /**
   * Called when Unit ID field is cleared
   */
  onUnitIdCleared(): void {
    this.currentUnitId.set('');
    this.checkDigit.set(null);
    this.validInterdictions.set([]);
    this.filteredInterdictions.set([]);
    this.interdictionForm.get('interCode')?.setValue('');
    this.selectedInterdiction.set(null);
    this.interdictionSearchControl.setValue('');
  }

  /**
   * Load valid interdictions for the current unit
   */
  private loadValidInterdictions(unitId: string): void {
    this.loading.set(true);

    this.service.getValidInterdictions(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (interdictions) => {
          this.validInterdictions.set(interdictions);
          this.filteredInterdictions.set(interdictions);
          this.loading.set(false);

          if (interdictions.length === 0) {
            this.snackbarService.showError('No valid interdictions available for this unit.');
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.snackbarService.showError(
            err?.error?.message || 'Failed to load interdiction codes.'
          );
        }
      });
  }

  /**
   * Place the current interdiction (add to table and call API)
   */
  onPlaceInterdiction(): void {
    if (!this.isFormValid()) {
      // Mark all controls as touched to show validation errors
      this.interdictionForm.markAllAsTouched();
      return;
    }

    const unitId = this.unitIdField?.parsedUnitId;
    const interCode = this.interdictionForm.get('interCode')?.value;

    if (!unitId || !interCode) {
      this.snackbarService.showError('Please enter a valid Unit ID and select an Interdiction Code.');
      return;
    }

    // Unit has already been validated (format + existence check via postValidate)
    // Proceed directly with adding interdiction
    this.isSubmitting.set(true);
    this.addInterdictionToUnit(unitId, interCode);
  }

  /**
   * Add interdiction to unit via API
   */
  private addInterdictionToUnit(unitId: string, interCode: string): void {
    const request: CreateUnitInterdictionDto = {
      unitId,
      interCode
    };

    this.service.addInterdiction(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);

          if (response.success && response.data) {
            // Success - add to table
            const selectedInter = this.selectedInterdiction();
            const newItem: AddedInterdictionItem = {
              unitId: response.data.unitId,
              interCode: response.data.interCode,
              interDesc: selectedInter?.interDesc || '',
              interType: selectedInter?.interType || '',
              insertDate: response.data.insertDate,
              insertUser: response.data.insertUser
            };

            // Add new item to raw data (sorting is handled by computed signal)
            const updated = [...this.rawInterdictions(), newItem];
            this.rawInterdictions.set(updated);

            // Increment session count
            this.sessionCount.set(this.sessionCount() + 1);

            // Show success message with count
            const message = `${this.sessionCount()} Units ID Interdiction Placed Successfully`;
            this.statusMessage.set(message);
            this.snackbarService.showSuccess(message);

            // Clear status message after announcement
            setTimeout(() => this.statusMessage.set(''), 3000);

            // Clear form for next entry
            this.clearFormForNextEntry();
          } else {
            // API returned error response
            const errorMessage = this.buildErrorMessage(response);
            this.snackbarService.showError(errorMessage);
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const errorMessage = err?.error?.message || 'Failed to add interdiction.';
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  /**
   * Build error message from API response
   */
  private buildErrorMessage(response: any): string {
    if (response.errorResponse?.error) {
      const errorCode = response.errorResponse.errorCode;
      const errorMsg = response.errorResponse.error;
      return errorCode ? `Error ${errorCode}: ${errorMsg}` : errorMsg;
    }
    return response.message || 'Failed to add interdiction.';
  }

  /**
   * Clear form fields for next entry (keep table visible)
   */
  private clearFormForNextEntry(): void {
    // Clear Unit ID field component
    if (this.unitIdField) {
      this.unitIdField.clear();
    }

    // Clear interdiction selection
    this.interdictionForm.get('interCode')?.setValue('');
    this.interdictionForm.markAsUntouched();
    this.interdictionForm.markAsPristine();

    // Clear state
    this.currentUnitId.set('');
    this.validInterdictions.set([]);
    this.selectedInterdiction.set(null);
  }

  /**
   * Clear all (reset entire component)
   */
  clearAll(): void {
    // Clear form
    this.clearFormForNextEntry();

    // Clear table
    this.rawInterdictions.set([]);
    this.sessionCount.set(0);

    // Reset signals
    this.loading.set(false);
    this.isSubmitting.set(false);

    // Return focus to Unit ID field for keyboard users
    setTimeout(() => {
      this.unitIdField?.focus();
    }, 100);
  }

  /**
   * Cancel and navigate back
   */
  onCancel(): void {
    this.router.navigate(['/home']);
  }
}
