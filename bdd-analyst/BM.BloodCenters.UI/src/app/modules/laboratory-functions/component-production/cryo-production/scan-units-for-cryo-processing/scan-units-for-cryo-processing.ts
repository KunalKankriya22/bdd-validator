import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { PageHeaderWithBreadcrumb } from '../../../../../shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '../../../../../shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '../../../../../shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
} from '../../../../../shared/interfaces/data-table.interface';
import { SnackbarService } from '../../../../../shared/services/snackbar.service';
import { UnitIdFieldComponent, UnitValidationResponse } from '../../../../../shared/components/unit-id-field';
import { ScanUnitsForCryoProcessingService } from './services/scan-units-for-cryo-processing.service';
import {
  CryoWorksheetDto,
  CryoUnitDto,
  CryoComponentDto,
  AddCryoUnitRequestDto,
} from './models/scan-units-for-cryo-processing.model';

/**
 * Scan Units for CRYO Processing Component (CRYO1)
 * Based on actual backend API from PR #1401
 */
@Component({
  selector: 'app-scan-units-for-cryo-processing',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
  ],
  templateUrl: './scan-units-for-cryo-processing.html',
  styleUrl: './scan-units-for-cryo-processing.scss',
})
export class ScanUnitsForCryoProcessingComponent implements OnInit, OnDestroy {
  // ViewChild references
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;
  @ViewChild('worksheetSelect') worksheetSelect!: ElementRef;
  @ViewChild('productCodeSelect') productCodeSelect!: MatSelect;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly snackbarService = inject(SnackbarService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly scanService = inject(ScanUnitsForCryoProcessingService);
  private readonly dialog = inject(MatDialog);

  // Cleanup subject
  private readonly destroy$ = new Subject<void>();

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    title: 'Scan Units for CRYO Processing',
    subtitle: 'Commit details into the system when CRYO-destined plasma (FFP) thawing has begun.',
    breadcrumbs: [
      { label: 'Home', link: '/' },
      { label: 'Scan Units for CRYO Processing', link: null },
    ],
  };

  // Forms
  worksheetForm!: FormGroup;
  unitEntryForm!: FormGroup;

  // Data
  availableWorksheets: CryoWorksheetDto[] = [];
  scannedUnits: CryoUnitDto[] = [];
  unprocessedUnits: CryoUnitDto[] = [];
  availableComponents: CryoComponentDto[] = [];

  // Search controls and filtered data
  readonly worksheetSearchControl = new FormControl('');
  readonly productCodeSearchControl = new FormControl('');
  readonly filteredWorksheets = signal<CryoWorksheetDto[]>([]);
  readonly filteredComponents = signal<CryoComponentDto[]>([]);

  // State
  isLoading = false;
  currentWorksheetId: string | null = null;

  // Current unit being processed
  currentUnit: UnitValidationResponse | null = null;

  // Table configuration
  tableConfig!: DataTableConfig<CryoUnitDto>;

  ngOnInit(): void {
    this.initializeForms();
    this.initializeTableConfig();
    this.setupWorksheetSearch();
    this.setupProductCodeSearch();
    this.loadAvailableWorksheets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize forms
   */
  private initializeForms(): void {
    // Worksheet selection form
    this.worksheetForm = this.fb.group({
      worksheetId: [null], // null = create new worksheet
    });

    // Unit entry form
    this.unitEntryForm = this.fb.group({
      collectionDate: [{ value: '', disabled: true }],
      productCode: [null, Validators.required],
      aborh: [{ value: '', disabled: true }],
    });

    // Listen to worksheet selection changes
    this.worksheetForm.get('worksheetId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((worksheetId) => {
        if (worksheetId) {
          this.checkWorksheetStatus(worksheetId);
        } else {
          this.clearWorksheetData();
        }
      });
  }

  /**
   * Initialize table configuration
   */
  private initializeTableConfig(): void {
    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: [],
      pagination: {
        pageSize: 25,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true,
      },
      sortConfig: {
        column: 'worksheetSeqNo',
        direction: 'default',
      },
      stickyHeader: true,
      emptyMessage: 'No Units Scanned',
      noDataIcon: 'edit',
      loadingMessage: 'Loading units...',
      showPagination: true,
      showTableOnEmpty: true, // Always show table headers even when empty
    };
  }

  /**
   * Get table columns definition with dynamic sequence header
   */
  private getTableColumns(): TableColumn<CryoUnitDto>[] {
    const sequenceHeader = `Sequence (${this.scannedUnits.length})`;

    return [
      {
        key: 'worksheetSeqNo',
        header: sequenceHeader,
        sortable: true,
        width: '150px',
      },
      {
        key: 'unitId',
        header: 'Unit ID',
        sortable: false,
        width: '200px',
      },
      {
        key: 'collDate',
        header: 'Collection Date',
        sortable: false,
        width: '180px',
        valueFormatter: (value) => this.formatDate(value),
      },
      {
        key: 'prodCode',
        header: 'Destined',
        sortable: false,
        width: '150px',
      },
      {
        key: 'aboDesc',
        header: 'ABORh',
        sortable: false,
        width: '150px',
      },
    ];
  }

  /**
   * Format date as dd-MMM-yyyy (uppercase month)
   */
  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  /**
   * Extract error message with error code from API error response
   * Format: "Error {code}: {message}" or just the message if no code
   */
  private getErrorMessage(error: any): string {
    const errorResponse = error?.error?.errorResponse;
    const errorCode = errorResponse?.errorCode || error?.error?.errorCode;
    const errorMessage = errorResponse?.error || error?.error?.message || error?.message || 'An error occurred';

    // If error code exists, format as "Error {code}: {message}"
    if (errorCode) {
      return `Error ${errorCode}: ${errorMessage}`;
    }

    return errorMessage;
  }

  /**
   * Setup worksheet search functionality
   */
  private setupWorksheetSearch(): void {
    this.worksheetSearchControl.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.filterWorksheets());
  }

  /**
   * Filter worksheets based on search text
   */
  private filterWorksheets(): void {
    const search = (this.worksheetSearchControl.value || '').toLowerCase().trim();

    if (!search) {
      this.filteredWorksheets.set(this.availableWorksheets);
      return;
    }

    const filtered = this.availableWorksheets.filter(worksheet =>
      worksheet.cryoWorksheetId.toLowerCase().includes(search)
    );

    this.filteredWorksheets.set(filtered);
  }

  /**
   * Setup product code search functionality
   */
  private setupProductCodeSearch(): void {
    this.productCodeSearchControl.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.filterProductCodes());
  }

  /**
   * Filter product codes based on search text
   */
  private filterProductCodes(): void {
    const search = (this.productCodeSearchControl.value || '').toLowerCase().trim();

    if (!search) {
      this.filteredComponents.set(this.availableComponents);
      return;
    }

    const filtered = this.availableComponents.filter(component =>
      component.productCode.toLowerCase().includes(search) ||
      component.productDesc.toLowerCase().includes(search)
    );

    this.filteredComponents.set(filtered);
  }

  /**
   * Load available worksheets from API
   */
  private loadAvailableWorksheets(): void {
    this.isLoading = true;
    this.scanService
      .getActiveWorksheets()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (worksheets) => {
          // Deduplicate worksheets by cryoWorksheetId to avoid Angular NG0955 error
          const seenIds = new Set<string>();
          const uniqueWorksheets = worksheets.filter(w => {
            if (seenIds.has(w.cryoWorksheetId)) {
              return false;
            }
            seenIds.add(w.cryoWorksheetId);
            return true;
          });

          this.availableWorksheets = uniqueWorksheets;
          this.filteredWorksheets.set(uniqueWorksheets);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.snackbarService.showError(this.getErrorMessage(error));

          // Set empty worksheets array on error so UI still works
          this.availableWorksheets = [];
          this.filteredWorksheets.set([]);
          this.isLoading = false;
        },
      });
  }

  /**
   * Check worksheet status and show warning if it has processed units
   */
  private checkWorksheetStatus(worksheetId: string): void {
    // Find the worksheet in the available worksheets list
    const worksheet = this.availableWorksheets.find(w => w.cryoWorksheetId === worksheetId);

    // If worksheet has processed units, show warning dialog
    if (worksheet && worksheet.processedUnits > 0) {
      this.showWorksheetProcessedWarning(worksheetId);
    } else {
      // Safe to load worksheet details
      this.loadWorksheetDetails(worksheetId);
    }
  }

  /**
   * Show warning dialog when worksheet has already been processed
   */
  private showWorksheetProcessedWarning(worksheetId: string): void {
    import('../../../../../shared/components/error-dialog/error-dialog.component').then((m) => {
      const dialogRef = this.dialog.open(m.ErrorDialogComponent, {
        width: '500px',
        disableClose: true, // Prevent closing by clicking backdrop or ESC
        hasBackdrop: true,  // Show backdrop
        data: {
          title: 'Error',
          message: `CRYO worksheet ${worksheetId} has already begun processing, so Unit ID's cannot be added.`,
        },
      });

      dialogRef.afterClosed().subscribe(() => {
        // Reset to empty state - clear worksheet selection
        this.worksheetForm.patchValue({ worksheetId: null }, { emitEvent: false });
        this.clearWorksheetData();
        this.cdr.detectChanges();
      });
    });
  }

  /**
   * Load details of selected worksheet
   */
  private loadWorksheetDetails(worksheetId: string): void {
    console.log('loadWorksheetDetails called with worksheetId:', worksheetId); // Debug

    this.isLoading = true;
    this.scanService
      .getUnprocessedUnits(worksheetId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (units) => {
          this.currentWorksheetId = worksheetId;

          console.log('GET units response:', units); // Debug logging

          // Display all units with sequence numbers
          // Filter out any units without sequence (shouldn't happen after POST)
          this.scannedUnits = units.filter(u =>
            u.worksheetSeqNo !== null && u.worksheetSeqNo !== undefined
          );

          console.log('Scanned units to display:', this.scannedUnits); // Debug logging
          console.log('Table config totalRecords:', this.scannedUnits.length); // Debug

          this.updateTablePagination();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('GET units FAILED:', error); // Debug
          this.snackbarService.showError(this.getErrorMessage(error));
          this.isLoading = false;
        },
      });
  }

  /**
   * Handle unit ID validation from UnitIdFieldComponent
   */
  onUnitValidated(response: UnitValidationResponse): void {
    if (response && response.parsedUnitId) {
      this.currentUnit = response;

      // Populate read-only fields
      this.unitEntryForm.patchValue({
        collectionDate: response.collectionDate || '',
        aborh: '', // Will be populated from API
        productCode: null,
      });

      // Load valid components for this unit
      this.loadValidComponents(response.parsedUnitId);
    } else {
      this.snackbarService.showError('Invalid unit ID');
      this.currentUnit = null;
      this.availableComponents = [];
      this.filteredComponents.set([]);
      this.unitEntryForm.patchValue({
        collectionDate: '',
        productCode: null,
        aborh: '',
      });
    }
  }

  /**
   * Load valid components for a unit
   */
  private loadValidComponents(unitId: string): void {
    console.log('Loading valid components for unit:', unitId); // Debug

    this.scanService
      .getValidComponents(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Valid components response:', response); // Debug

          this.availableComponents = response;
          this.filteredComponents.set(response);

          if (response.length === 0) {
            console.warn('No components returned for unit:', unitId); // Debug
            this.snackbarService.showError('No valid components available for this unit');
            this.clearForNextUnit();
          }

          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading components:', error); // Debug
          // Backend returns error code when unit cannot be processed
          this.snackbarService.showError(this.getErrorMessage(error));
          this.availableComponents = [];
          this.filteredComponents.set([]);
          this.clearForNextUnit();
        },
      });
  }

  /**
   * Handle product code selection
   */
  onProductCodeChange(): void {
    const productCode = this.unitEntryForm.get('productCode')?.value;

    if (!this.currentUnit || !productCode) {
      return;
    }

    // Add unit to worksheet
    this.addUnitToWorksheet(productCode);
  }

  /**
   * Add unit to worksheet
   */
  private addUnitToWorksheet(productCode: string): void {
    if (!this.currentUnit?.parsedUnitId) {
      this.snackbarService.showError('No unit selected');
      return;
    }

    this.isLoading = true;

    // If no worksheet selected, generate new one first
    if (!this.currentWorksheetId) {
      this.scanService
        .generateWorksheetId()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (worksheetId) => {
            this.currentWorksheetId = worksheetId;

            // Add the newly generated worksheet to the dropdown options so it displays
            const newWorksheet: CryoWorksheetDto = {
              cryoWorksheetId: worksheetId,
              insertDats: new Date(),
              totalUnits: 0,
              processedUnits: 0,
              unprocessedUnits: 0,
            };
            this.availableWorksheets = [newWorksheet, ...this.availableWorksheets];
            this.filteredWorksheets.set(this.availableWorksheets);

            this.worksheetForm.patchValue({ worksheetId }, { emitEvent: false });
            this.cdr.detectChanges();
            this.performAddUnit(worksheetId, productCode);
          },
          error: (error) => {
            this.isLoading = false;
            this.snackbarService.showError(this.getErrorMessage(error));
          },
        });
    } else {
      this.performAddUnit(this.currentWorksheetId, productCode);
    }
  }

  /**
   * Perform the actual add unit API call
   */
  private performAddUnit(worksheetId: string, productCode: string, overrideInterdiction = false): void {
    if (!this.currentUnit?.parsedUnitId) return;

    const dto: AddCryoUnitRequestDto = {
      unitId: this.currentUnit.parsedUnitId,
      prodCode: productCode,
      overrideInterdiction,
    };

    this.scanService
      .addUnitToWorksheet(worksheetId, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess(`Unit added successfully`);

          // Refresh the table by calling GET API
          this.loadWorksheetDetails(worksheetId);

          // Clear for next entry
          this.clearForNextUnit();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          const errorCode = error?.error?.errorResponse?.errorCode || error?.error?.errorCode || '';

          // Interdiction warning (0184) — show yes/no confirmation
          if (errorCode === '0184' && !overrideInterdiction) {
            this.showInterdictionWarning(worksheetId, productCode);
            return;
          }

          this.snackbarService.showError(this.getErrorMessage(error));
        },
      });
  }

  /**
   * Show interdiction warning dialog with Yes/No option
   */
  private showInterdictionWarning(worksheetId: string, productCode: string): void {
    import('../../../../../shared/components/confirm-action-dialog/confirm-action-dialog.component').then((m) => {
      const dialogRef = this.dialog.open(m.ConfirmActionDialogComponent, {
        width: '480px',
        disableClose: true,
        data: {
          title: 'Warning',
          message: 'Unit has interdictions. Do you want to continue?',
          confirmText: 'Yes',
          cancelText: 'No',
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result === true) {
          this.isLoading = true;
          this.performAddUnit(worksheetId, productCode, true);
        } else {
          this.clearForNextUnit();
        }
      });
    });
  }

  /**
   * Clear button clicked - reset worksheet and start new
   */
  onClearClick(): void {
    this.clearAll();
    this.snackbarService.showInfo('Ready to create new worksheet');
  }

  /**
   * Clear all data to start fresh
   */
  private clearAll(): void {
    this.worksheetForm.reset({ worksheetId: null });
    this.currentWorksheetId = null;
    this.scannedUnits = [];
    this.unprocessedUnits = [];
    this.availableComponents = [];
    this.filteredComponents.set([]);
    this.worksheetSearchControl.setValue('', { emitEvent: false });
    this.productCodeSearchControl.setValue('', { emitEvent: false });
    this.clearForNextUnit();
    this.updateTablePagination();
  }

  /**
   * Clear data for next unit entry
   */
  private clearForNextUnit(): void {
    this.currentUnit = null;
    this.availableComponents = [];
    this.filteredComponents.set([]);
    this.productCodeSearchControl.setValue('', { emitEvent: false });

    // Reset form and clear validation state
    this.unitEntryForm.reset();
    this.unitEntryForm.markAsPristine();
    this.unitEntryForm.markAsUntouched();

    // Reset all form controls to untouched state
    Object.keys(this.unitEntryForm.controls).forEach(key => {
      this.unitEntryForm.get(key)?.markAsUntouched();
      this.unitEntryForm.get(key)?.markAsPristine();
    });

    // Clear unit ID field
    if (this.unitIdField) {
      this.unitIdField.clear();
      setTimeout(() => this.unitIdField.focus(), 100);
    }
  }

  /**
   * Clear worksheet data but keep worksheet ID selected
   */
  private clearWorksheetData(): void {
    this.scannedUnits = [];
    this.unprocessedUnits = [];
    this.updateTablePagination();
  }

  /**
   * Update table pagination and columns (for dynamic header)
   */
  private updateTablePagination(): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.totalRecords = this.scannedUnits.length;
    }
    // Update columns to refresh the Sequence header with new count
    this.tableConfig.columns = this.getTableColumns();
  }

  /**
   * Worksheet dropdown display function
   */
  worksheetDisplayFn(worksheet: CryoWorksheetDto | null): string {
    if (!worksheet) return '';
    return worksheet.cryoWorksheetId;
  }

  /**
   * TrackBy function for worksheets to prevent Angular duplicate key errors
   */
  trackByWorksheetId(index: number, worksheet: CryoWorksheetDto): string {
    return `${worksheet.cryoWorksheetId}-${index}`;
  }

  /**
   * TrackBy function for product codes to prevent Angular duplicate key errors
   */
  trackByProductCode(index: number, component: CryoComponentDto): string {
    return `${component.productCode}-${index}`;
  }
}
