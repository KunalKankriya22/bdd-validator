import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent } from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import {
  ActionType,
  InterdictionRecord,
  UnitRecord,
} from './models/place-release-interdiction.model';
import { PlaceReleaseInterdictionApiService } from './services/place-release-interdiction-api.service';

// Interdiction Row interface for inline editing
interface InterdictionRow extends InterdictionRecord {
  id: number;
  isNew: boolean;
}

// Frontend validation error codes
const ERROR_CODES = {
  DUPLICATE_UNIT: 1001,
  DUPLICATE_INTERDICTION: 1002,
  ALL_DUPLICATES: 1003,
  MISSING_DATA: 1004,
} as const;

/**
 * Place/Release Multiple Unit Interdiction Component
 * JIRA: MLT-13197
 * Mnemonic: UNTINT2
 *
 * Place or release the same interdiction across multiple units
 * in a single action for efficient batch processing.
 */
@Component({
  selector: 'app-place-release-multiple-unit-interdiction',
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
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
  ],
  templateUrl: './place-release-multiple-unit-interdiction.html',
  styleUrl: './place-release-multiple-unit-interdiction.scss',
})
export class PlaceReleaseMultipleUnitInterdiction implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `place-release-interdiction-${PlaceReleaseMultipleUnitInterdiction.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependencies
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(PlaceReleaseInterdictionApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  // Page header configuration
  protected readonly pageHeaderConfig = computed<PageHeaderConfig>(() => ({
    title: 'Place/Release Multiple Unit Interdiction',
    subtitle: 'Place or release the same interdiction across multiple units in a single action for efficient batch processing.',
    breadcrumbs: [
      { label: 'Home', path: '/' },
      { label: 'Laboratory Functions', path: '/laboratory-functions' },
      { label: 'Place/Release Multiple Unit Interdiction', path: '' },
    ],
  }));

  // Forms
  actionForm!: FormGroup;

  private nextRowId = 1;

  // Signal-based state
  protected readonly selectedAction = signal<ActionType | null>(null);
  protected readonly interdictionRows = signal<InterdictionRow[]>([]);
  protected readonly availableInterdictionCodes = signal<InterdictionRecord[]>([]);
  protected readonly units = signal<UnitRecord[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly loadingInterdictions = signal<boolean>(false);
  protected readonly loadingUnits = signal<boolean>(false);
  protected readonly scanningUnit = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  // Search controls
  protected readonly interdictionSearchControl = new FormControl<string>('');
  protected readonly tableSearchTerm = signal<string>('');
  protected readonly dropdownSearchTerm = signal<string>('');

  // Action options
  protected readonly actionOptions: ActionType[] = ['PLACE', 'RELEASE'];

  // Computed values
  protected readonly totalInterdictionCount = computed(() =>
    this.interdictionRows().filter(r => !r.isNew || r.interCode).length
  );

  protected readonly filteredInterdictionRows = computed(() => {
    const rows = this.interdictionRows();
    const search = this.tableSearchTerm().toLowerCase().trim();
    if (!search) return rows;
    return rows.filter(r =>
      r.isNew ||
      r.interCode.toLowerCase().includes(search) ||
      r.interType.toLowerCase().includes(search) ||
      r.interDesc.toLowerCase().includes(search)
    );
  });

  protected readonly filteredDropdownOptions = computed(() => {
    const all = this.availableInterdictionCodes();
    const search = this.dropdownSearchTerm().toLowerCase().trim();
    if (!search) return all;
    return all.filter(c =>
      c.interCode.toLowerCase().includes(search) ||
      c.interDesc.toLowerCase().includes(search)
    );
  });

  protected readonly unitTableConfig: DataTableConfig<UnitRecord> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: false },
      {
        key: 'collDate',
        header: 'Collection Date',
        sortable: false,
        valueFormatter: (value) => this.formatDate(value)
      },
    ],
    enableSelection: false,
    showPagination: false,
    stickyHeader: false,
    showTableOnEmpty: true,
    emptyMessage: 'No units added',
    enableRowHighlight: false,
    rowActions: [
      {
        icon: 'delete',
        label: 'Delete',
        action: 'delete',
        color: 'warn',
      },
    ],
  };

  constructor() {
    // Update column headers when counts change
    effect(() => {
      const unitCount = this.totalUnitCount();
      this.unitTableConfig.columns[0].header = `Unit ID (${unitCount})`;
    });
  }

  // Computed values
  protected readonly isEmpty = computed(() =>
    !this.loading() && this.selectedAction() === null
  );

  protected readonly isReady = computed(() =>
    !this.loading() && !this.error()
  );

  protected readonly totalUnitCount = computed(() =>
    this.units().length
  );

  protected readonly canCommit = computed(() => {
    const validInterdictions = this.interdictionRows().filter(r => r.interCode && !r.isNew);
    const hasInterdictions = validInterdictions.length > 0;
    const hasUnits = this.totalUnitCount() > 0;
    return hasInterdictions && hasUnits && this.selectedAction() !== null;
  });

  ngOnInit(): void {
    this.initForms();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    this.actionForm = this.fb.group({
      action: [null, [Validators.required]],
    });
  }

  private setupFormListeners(): void {
    // When action changes, load interdictions or units
    this.actionForm.get('action')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((action: ActionType) => {
        this.selectedAction.set(action);
        this.clearAll();

        if (action === 'PLACE') {
          this.loadActiveInterdictions();
        } else if (action === 'RELEASE') {
          this.loadActiveInterdictions();
        }
      });

    this.interdictionSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.dropdownSearchTerm.set(value || '');
      });
  }

  protected onTableSearchChange(value: string): void {
    this.tableSearchTerm.set(value);
  }

  private loadActiveInterdictions(): void {
    const action = this.selectedAction();
    if (!action) return;

    this.loadingInterdictions.set(true);
    this.error.set(null);

    this.apiService.getInterdictionCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (interdictions) => {
          this.availableInterdictionCodes.set(interdictions);
          this.loadingInterdictions.set(false);
        },
        error: (err) => {
          console.error('Error loading interdictions:', err);
          console.error('Error details:', {
            message: err?.message,
            error: err?.error,
            status: err?.status,
            statusText: err?.statusText
          });
          const errorCode = err?.error?.errorCode || err?.error?.errorResponse?.errorCode;
          const errorMessage = errorCode
            ? `Error Code: ${errorCode} Failed to load active interdictions`
            : 'Failed to load active interdictions.';
          this.error.set(errorMessage);
          this.loadingInterdictions.set(false);
          this.snackbarService.showError(errorMessage);
        },
      });
  }

  /**
   * Handle unit validation from app-unit-id-field component
   */
  protected onUnitValidated(event: UnitValidationResponse): void {
    if (!event.parsedUnitId) return;

    // Check for duplicates
    if (this.units().some(u => u.unitId === event.parsedUnitId)) {
      this.snackbarService.showError(`Error Code: ${ERROR_CODES.DUPLICATE_UNIT} Unit already added`);
      return;
    }

    // Add unit directly from validation response
    const unit: UnitRecord = {
      unitId: event.parsedUnitId,
      checkDigit: event.checkDigit,
      collDate: event.collectionDate || null,
      collectionDate: event.collectionDate || null,
    };

    this.units.set([...this.units(), unit]);
  }

  /**
   * Handle unit field clear
   */
  protected onUnitCleared(): void {
    // Unit ID field cleared, no action needed
  }

  /**
   * Handle Add Multiple Interdictions button click - opens side panel
   */
  protected onAddMultipleInterdictions(): void {
    import('./select-interdictions-dialog/select-interdictions-dialog').then(m => {
      const dialogRef = this.dialog.open(m.SelectInterdictionsDialog, {
        width: '800px',
        maxWidth: '90vw',
        height: '100vh',
        maxHeight: '100vh',
        position: { right: '0' },
        panelClass: 'side-panel-dialog',
        disableClose: false,
      });

      dialogRef.afterClosed().subscribe((selectedInterdictions: InterdictionRecord[] | null) => {
        if (selectedInterdictions && selectedInterdictions.length > 0) {
          this.addMultipleInterdictions(selectedInterdictions);
        }
      });
    });
  }

  /**
   * Add multiple interdictions from side panel selection
   */
  private addMultipleInterdictions(interdictions: InterdictionRecord[]): void {
    const currentRows = [...this.interdictionRows()];
    const existingCodes = new Set(currentRows.map(r => r.interCode));

    let addedCount = 0;
    let duplicateCount = 0;

    interdictions.forEach(interdiction => {
      if (!existingCodes.has(interdiction.interCode)) {
        const newRow: InterdictionRow = {
          id: this.nextRowId++,
          interCode: interdiction.interCode,
          interType: interdiction.interType,
          interDesc: interdiction.interDesc,
          isNew: false,
        };
        currentRows.unshift(newRow); // Add at the beginning
        existingCodes.add(interdiction.interCode);
        addedCount++;
      } else {
        duplicateCount++;
      }
    });

    this.interdictionRows.set(currentRows);

    // Show appropriate message
    if (addedCount > 0 && duplicateCount === 0) {
      this.snackbarService.showSuccess(`${addedCount} interdiction(s) added successfully`);
    } else if (addedCount > 0 && duplicateCount > 0) {
      this.snackbarService.showInfo(`${addedCount} interdiction(s) added, ${duplicateCount} duplicate(s) skipped`);
    } else if (duplicateCount > 0) {
      this.snackbarService.showError(`Error Code: ${ERROR_CODES.ALL_DUPLICATES} All selected interdictions already exist`);
    }

    // In RELEASE mode, reload units
    if (this.selectedAction() === 'RELEASE' && addedCount > 0) {
      const interCodes = currentRows.filter(r => r.interCode && !r.isNew).map(r => r.interCode);
      if (interCodes.length > 0) {
        this.loadUnitsByInterdictions(interCodes);
      }
    }
  }

  /**
   * Handle Add New Row button click - adds empty row at top
   */
  protected onAddInterdictionRow(): void {
    const newRow: InterdictionRow = {
      id: this.nextRowId++,
      interCode: '',
      interType: '',
      interDesc: '',
      isNew: true,
    };

    // Add new row at the beginning
    this.interdictionRows.set([newRow, ...this.interdictionRows()]);
  }

  /**
   * Handle interdiction code selection in dropdown (by row ID for filtered-list safety)
   */
  protected onInterdictionCodeSelected(rowId: number, interCode: string): void {
    const rows = [...this.interdictionRows()];
    const rowIndex = rows.findIndex(r => r.id === rowId);
    if (rowIndex === -1) return;

    const row = rows[rowIndex];
    const interdiction = this.availableInterdictionCodes().find(i => i.interCode === interCode);

    if (interdiction) {
      const duplicate = rows.some((r, i) => i !== rowIndex && r.interCode === interdiction.interCode);

      if (duplicate) {
        this.snackbarService.showError(`Error Code: ${ERROR_CODES.DUPLICATE_INTERDICTION} This interdiction code is already added`);
        return;
      }

      row.interCode = interdiction.interCode;
      row.interType = interdiction.interType;
      row.interDesc = interdiction.interDesc;
      row.isNew = false;

      this.interdictionRows.set(rows);
      this.interdictionSearchControl.reset();

      if (this.selectedAction() === 'RELEASE') {
        const interCodes = rows.filter(r => r.interCode && !r.isNew).map(r => r.interCode);
        if (interCodes.length > 0) {
          this.loadUnitsByInterdictions(interCodes);
        }
      }
    }
  }

  /**
   * Delete an interdiction row by ID (for filtered-list safety)
   */
  protected deleteInterdictionById(rowId: number): void {
    const rows = this.interdictionRows().filter(r => r.id !== rowId);
    this.interdictionRows.set(rows);

    if (this.selectedAction() === 'RELEASE') {
      const interCodes = rows.filter(r => r.interCode && !r.isNew).map(r => r.interCode);
      if (interCodes.length > 0) {
        this.loadUnitsByInterdictions(interCodes);
      } else {
        this.units.set([]);
      }
    }
  }

  private loadUnitsByInterdictions(codes: string[]): void {
    this.loadingUnits.set(true);

    this.apiService.getUnitsForRelease(codes)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (units) => {
          this.units.set(units.map(u => ({
            unitId: u.unitId,
            collDate: u.collDate,
            collectionDate: u.collDate,
          })));
          this.loadingUnits.set(false);
        },
        error: (err) => {
          console.error('Error loading units:', err);
          const errorCode = err?.error?.errorCode || err?.error?.errorResponse?.errorCode;
          const errorMessage = errorCode
            ? `Error Code: ${errorCode} Failed to load units`
            : 'Failed to load units.';
          this.snackbarService.showError(errorMessage);
          this.loadingUnits.set(false);
        },
      });
  }

  /**
   * Handle row action (delete) from data table for units
   */
  protected onUnitRowAction(event: { action: string; row: UnitRecord }): void {
    if (event.action === 'delete') {
      this.deleteUnit(event.row);
    }
  }

  private deleteUnit(unit: UnitRecord): void {
    const filtered = this.units().filter(u => u.unitId !== unit.unitId);
    this.units.set(filtered);
  }

  /**
   * Clear all interdictions and units
   */
  protected onClearAll(): void {
    this.clearAll();
    this.actionForm.patchValue({ action: null });
    this.actionForm.markAsUntouched();
    this.actionForm.markAsPristine();
    this.snackbarService.showInfo('All data cleared.');
  }

  /**
   * Commit action: Place or Release interdictions
   */
  protected onCommit(): void {
    if (!this.canCommit()) {
      this.snackbarService.showError(`Error Code: ${ERROR_CODES.MISSING_DATA} Please add at least one interdiction and one unit`);
      return;
    }

    const action = this.selectedAction()!;
    const interCodes = this.interdictionRows()
      .filter(r => r.interCode && !r.isNew)
      .map(r => r.interCode);
    const units = this.units().map(u => ({
      unitId: u.unitId,
      collDate: u.collDate || u.collectionDate,
    }));

    this.loading.set(true);

    const executeAction$ = action === 'PLACE'
      ? this.apiService.placeInterdictions(interCodes, units)
      : this.apiService.releaseInterdictions(interCodes, units);

    executeAction$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          const successMessage = `Successfully ${action.toLowerCase()}d ${result.processedCount} interdiction(s)`;

          if (result.skippedCount > 0) {
            this.snackbarService.showInfo(`${successMessage}. ${result.skippedCount} failed.`);
            if (result.errors && result.errors.length > 0) {
              console.warn('Errors:', result.errors);
              result.errors.forEach((error: any) => {
                // Check if error is an object with errorCode and message, or just a string
                if (typeof error === 'object' && error.errorCode) {
                  this.snackbarService.showError(`Error Code: ${error.errorCode} ${error.message || 'Operation failed'}`);
                } else {
                  this.snackbarService.showError(error);
                }
              });
            }
          } else {
            this.snackbarService.showSuccess(successMessage);
          }

          this.clearAll();
          this.actionForm.patchValue({ action: null });
          this.actionForm.markAsUntouched();
          this.actionForm.markAsPristine();
          this.loading.set(false);
        },
        error: (err) => {
          console.error(`Error executing ${action}:`, err);
          const errorCode = err?.error?.errorCode || err?.error?.errorResponse?.errorCode;
          const baseMessage = err?.error?.message || err?.error?.error || err?.message || `Failed to ${action.toLowerCase()} interdictions`;
          const errorMessage = errorCode
            ? `Error Code: ${errorCode} ${baseMessage}`
            : baseMessage;
          this.snackbarService.showError(errorMessage);
          this.loading.set(false);
        },
      });
  }

  protected formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : String(date);
  }

  private clearAll(): void {
    this.interdictionRows.set([]);
    this.units.set([]);
    this.tableSearchTerm.set('');
    this.interdictionSearchControl.reset();
  }

  protected get f() {
    return this.actionForm.controls;
  }
}
